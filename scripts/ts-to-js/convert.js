#!/usr/bin/env node
/**
 * Converts a TypeScript (NestJS or generic) source tree to plain JavaScript.
 *
 * Why this exists: NestJS's DI normally relies on `emitDecoratorMetadata`
 * inspecting constructor parameter TYPES to build `design:paramtypes`.
 * Plain JS has no type annotations, so before stripping types away we must:
 *   1. Expand TS parameter-property constructor sugar (`private x: Foo`)
 *      into explicit `this.x = x;` assignments (ALL classes).
 *   2. For classes carrying a Nest class-level decorator
 *      (@Injectable/@Controller/@Catch/@WebSocketGateway/@Processor/@Resolver),
 *      add an explicit `@Inject(Type)` to constructor parameters that relied
 *      on implicit type-based injection (no existing parameter decorator,
 *      and the type is a simple identifier imported as a value in this file).
 *
 * After those two AST-level rewrites, `ts.transpileModule` is used to strip
 * the rest of the TypeScript syntax (interfaces, generics, type annotations,
 * type-only imports, etc.) producing valid plain JavaScript (with NestJS
 * legacy decorator syntax preserved, since decorators are part of the
 * runtime behavior, not type information).
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const NEST_CLASS_DECORATORS = new Set([
  'Injectable',
  'Controller',
  'Catch',
  'WebSocketGateway',
  'Processor',
  'Resolver',
]);

const NON_INJECTABLE_TYPE_NAMES = new Set([
  'string', 'number', 'boolean', 'any', 'unknown', 'void', 'never', 'object',
  'undefined', 'null', 'Function', 'Object', 'Array', 'Promise', 'Date',
  'RegExp', 'Error', 'Map', 'Set', 'Record',
]);

function getDecoratorName(decorator) {
  let expr = decorator.expression;
  if (ts.isCallExpression(expr)) expr = expr.expression;
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return undefined;
}

function classHasNestDecorator(node) {
  const decorators = ts.getDecorators ? ts.getDecorators(node) : node.decorators;
  if (!decorators) return false;
  return decorators.some((d) => NEST_CLASS_DECORATORS.has(getDecoratorName(d)));
}

function collectValueImportedIdentifiers(sourceFile) {
  // Returns a Map<name, moduleSpecifier|null>. moduleSpecifier is null for
  // same-file local declarations (class/function/const), since those need no import.
  const names = new Map();
  sourceFile.statements.forEach((stmt) => {
    if (!ts.isImportDeclaration(stmt) || !stmt.importClause) return;
    if (stmt.importClause.isTypeOnly) return;
    if (!ts.isStringLiteral(stmt.moduleSpecifier)) return;
    const moduleSpecifier = stmt.moduleSpecifier.text;
    const clause = stmt.importClause;
    if (clause.name) names.set(clause.name.text, moduleSpecifier);
    if (clause.namedBindings) {
      if (ts.isNamedImports(clause.namedBindings)) {
        clause.namedBindings.elements.forEach((el) => {
          if (el.isTypeOnly) return;
          names.set(el.name.text, moduleSpecifier);
        });
      } else if (ts.isNamespaceImport(clause.namedBindings)) {
        names.set(clause.namedBindings.name.text, moduleSpecifier);
      }
    }
  });
  sourceFile.statements.forEach((stmt) => {
    if (ts.isClassDeclaration(stmt) && stmt.name) names.set(stmt.name.text, null);
    if (ts.isFunctionDeclaration(stmt) && stmt.name) names.set(stmt.name.text, null);
    if (ts.isVariableStatement(stmt)) {
      stmt.declarationList.declarations.forEach((d) => {
        if (ts.isIdentifier(d.name)) names.set(d.name.text, null);
      });
    }
  });
  return names;
}

function simpleTypeReferenceName(typeNode) {
  if (!typeNode) return undefined;
  if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
    return typeNode.typeName.text;
  }
  return undefined;
}

function paramHasExplicitDecorator(param) {
  const decorators = ts.getDecorators ? ts.getDecorators(param) : param.decorators;
  return !!(decorators && decorators.length > 0);
}

function isParameterProperty(param) {
  const mods = ts.getModifiers ? ts.getModifiers(param) : param.modifiers;
  if (!mods) return false;
  return mods.some(
    (m) =>
      m.kind === ts.SyntaxKind.PublicKeyword ||
      m.kind === ts.SyntaxKind.PrivateKeyword ||
      m.kind === ts.SyntaxKind.ProtectedKeyword ||
      m.kind === ts.SyntaxKind.ReadonlyKeyword,
  );
}

function stripParamModifiersAndDecorators(param, factory, keepDecorators) {
  return factory.updateParameterDeclaration(
    param,
    keepDecorators,
    undefined,
    param.name,
    undefined,
    undefined,
    param.initializer,
  );
}

function createInjectDecorator(factory, typeName, addImport) {
  addImport('Inject');
  return factory.createDecorator(
    factory.createCallExpression(factory.createIdentifier('Inject'), undefined, [
      factory.createIdentifier(typeName),
    ]),
  );
}

function transformSourceFile(sourceFile, context, injectedTypesOut) {
  const factory = context.factory;
  const valueImported = collectValueImportedIdentifiers(sourceFile);
  let needsInjectImport = false;

  function addImport(name) {
    if (name === 'Inject') needsInjectImport = true;
  }

  function visitClass(classNode) {
    const isDiClass = classHasNestDecorator(classNode);

    const newMembers = classNode.members.map((member) => {
      if (!ts.isConstructorDeclaration(member) || !member.body) return member;

      const assignments = [];
      let anyParamChanged = false;
      const newParams = member.parameters.map((param) => {
        const isPropParam = isParameterProperty(param);
        const hasExistingDecorator = paramHasExplicitDecorator(param);
        let decorators = ts.getDecorators ? ts.getDecorators(param) || [] : param.decorators || [];

        if (isPropParam && ts.isIdentifier(param.name)) {
          assignments.push(
            factory.createExpressionStatement(
              factory.createAssignment(
                factory.createPropertyAccessExpression(
                  factory.createThis(),
                  factory.createIdentifier(param.name.text),
                ),
                factory.createIdentifier(param.name.text),
              ),
            ),
          );
        }

        let addedInject = false;
        if (isDiClass && !hasExistingDecorator) {
          const typeName = simpleTypeReferenceName(param.type);
          if (
            typeName &&
            !NON_INJECTABLE_TYPE_NAMES.has(typeName) &&
            valueImported.has(typeName)
          ) {
            decorators = [createInjectDecorator(factory, typeName, addImport)];
            addedInject = true;
            const moduleSpecifier = valueImported.get(typeName);
            if (moduleSpecifier) {
              injectedTypesOut.push({ name: typeName, moduleSpecifier });
            }
          }
        }

        if (isPropParam || addedInject || param.type) {
          anyParamChanged = true;
        }

        return stripParamModifiersAndDecorators(param, factory, decorators);
      });

      if (!anyParamChanged && assignments.length === 0) return member;

      // In a derived class, `this` cannot be accessed before `super(...)` runs.
      // If the existing constructor body's first statement is a `super(...)` call
      // (the only legal position for it), insert our parameter-property
      // assignments immediately after it instead of prepending them to the front.
      const existingStatements = member.body.statements;
      const firstStmt = existingStatements[0];
      const firstIsSuperCall =
        firstStmt &&
        ts.isExpressionStatement(firstStmt) &&
        ts.isCallExpression(firstStmt.expression) &&
        firstStmt.expression.expression.kind === ts.SyntaxKind.SuperKeyword;

      const newStatements = firstIsSuperCall
        ? [firstStmt, ...assignments, ...existingStatements.slice(1)]
        : [...assignments, ...existingStatements];

      const newBody = factory.updateBlock(member.body, newStatements);

      return factory.updateConstructorDeclaration(
        member,
        ts.getModifiers ? ts.getModifiers(member) : member.modifiers,
        newParams,
        newBody,
      );
    });

    return factory.updateClassDeclaration(
      classNode,
      classNode.modifiers, // already includes decorators merged in (TS 4.8+ unified modifiers array)
      classNode.name,
      classNode.typeParameters,
      classNode.heritageClauses,
      newMembers,
    );
  }

  function visit(node) {
    if (ts.isClassDeclaration(node)) {
      node = visitClass(node);
    }
    return ts.visitEachChild(node, visit, context);
  }

  let result = ts.visitNode(sourceFile, visit);

  if (needsInjectImport) {
    result = ensureNamedImport(result, factory, 'Inject', '@nestjs/common');
  }

  return result;
}

function ensureNamedImport(sourceFile, factory, importName, moduleName) {
  let found = false;
  const newStatements = sourceFile.statements.map((stmt) => {
    if (
      ts.isImportDeclaration(stmt) &&
      ts.isStringLiteral(stmt.moduleSpecifier) &&
      stmt.moduleSpecifier.text === moduleName &&
      stmt.importClause &&
      stmt.importClause.namedBindings &&
      ts.isNamedImports(stmt.importClause.namedBindings)
    ) {
      const already = stmt.importClause.namedBindings.elements.some(
        (el) => el.name.text === importName,
      );
      if (already) {
        found = true;
        return stmt;
      }
      found = true;
      const newElements = [
        ...stmt.importClause.namedBindings.elements,
        factory.createImportSpecifier(false, undefined, factory.createIdentifier(importName)),
      ];
      return factory.updateImportDeclaration(
        stmt,
        stmt.modifiers,
        factory.updateImportClause(
          stmt.importClause,
          stmt.importClause.isTypeOnly,
          stmt.importClause.name,
          factory.updateNamedImports(stmt.importClause.namedBindings, newElements),
        ),
        stmt.moduleSpecifier,
        stmt.assertClause,
      );
    }
    return stmt;
  });

  if (found) {
    return factory.updateSourceFile(sourceFile, newStatements);
  }

  const importDecl = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(false, undefined, factory.createIdentifier(importName)),
      ]),
    ),
    factory.createStringLiteral(moduleName),
  );
  return factory.updateSourceFile(sourceFile, [importDecl, ...newStatements]);
}

// Safety net: ts.transpileModule (single-file mode, no full program/checker)
// does not always elide inline `type` import specifiers (e.g. `import { type Foo, Bar }`).
// Strip any leftover inline type-only specifiers post-hoc.
function stripInlineTypeImportSpecifiers(code) {
  return code.replace(
    /import\s*\{([^}]*)\}\s*from/g,
    (full, inner) => {
      if (!/\btype\s+[A-Za-z_$]/.test(inner)) return full;
      const parts = inner
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && !/^type\s+/.test(p));
      return `import { ${parts.join(', ')} } from`;
    },
  );
}

// After transpileModule runs its (usage-based) import elision, check whether
// any import we relied on for an @Inject(Type) we just added got dropped --
// this happens when, pre-conversion, the identifier was ONLY ever referenced
// in type positions (so TS's elision logic doesn't know our new decorator
// usage should keep it alive). Re-insert exactly those specific imports;
// leave all other normal elision (e.g. of truly type-only imports like
// `import { Request } from 'express'` used only in signatures) untouched.
function reinsertDroppedInjectImports(outputText, injectedTypes) {
  if (injectedTypes.length === 0) return outputText;

  const sourceFile = ts.createSourceFile(
    'check.ts',
    outputText,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );

  const importedNames = new Set();
  sourceFile.statements.forEach((stmt) => {
    if (!ts.isImportDeclaration(stmt) || !stmt.importClause) return;
    const clause = stmt.importClause;
    if (clause.name) importedNames.add(clause.name.text);
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      clause.namedBindings.elements.forEach((el) => importedNames.add(el.name.text));
    }
  });

  const missing = injectedTypes.filter((t) => !importedNames.has(t.name));
  if (missing.length === 0) return outputText;

  // Group by module specifier and prepend a fresh import statement per module
  // (simplest robust approach -- avoids re-parsing/re-printing the whole file
  // through the factory; a small amount of import duplication across separate
  // statements for the same module is harmless in JS).
  const byModule = new Map();
  for (const { name, moduleSpecifier } of missing) {
    if (!byModule.has(moduleSpecifier)) byModule.set(moduleSpecifier, new Set());
    byModule.get(moduleSpecifier).add(name);
  }

  let prefix = '';
  for (const [moduleSpecifier, names] of byModule) {
    prefix += `import { ${[...names].join(', ')} } from '${moduleSpecifier}';\n`;
  }

  return prefix + outputText;
}

function convertSource(original, srcPath) {
  const isTsx = srcPath.endsWith('.tsx');
  const injectedTypes = [];

  const transpiled = ts.transpileModule(original, {
    fileName: srcPath,
    compilerOptions: {
      module: ts.ModuleKind.Preserve, // keep import/export syntax as-is; only strip types & lower decorators
      target: ts.ScriptTarget.ESNext,
      verbatimModuleSyntax: false, // allow normal usage-based elision of genuinely type-only imports
      experimentalDecorators: true,
      emitDecoratorMetadata: true, // re-enabled: gives @nestjs/swagger design:paramtypes for route handlers; constructor DI still uses our explicit @Inject() (SELF_DECLARED_DEPS_METADATA takes precedence over design:paramtypes for DI resolution)
      jsx: isTsx ? ts.JsxEmit.Preserve : undefined,
      removeComments: false,
    },
    transformers: {
      before: [(context) => (sourceFile) => transformSourceFile(sourceFile, context, injectedTypes)],
    },
    reportDiagnostics: false,
  });

  const withImportsFixed = reinsertDroppedInjectImports(transpiled.outputText, injectedTypes);
  return stripInlineTypeImportSpecifiers(withImportsFixed);
}

function convertFile(srcPath) {
  const original = fs.readFileSync(srcPath, 'utf8');
  return convertSource(original, srcPath);
}

module.exports = { convertFile, convertSource };

if (require.main === module) {
  const files = process.argv.slice(2);
  for (const f of files) {
    const out = convertFile(f);
    process.stdout.write(`===== ${f} =====\n${out}\n`);
  }
}
