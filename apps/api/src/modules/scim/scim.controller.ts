import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';

import { ScimAuthGuard } from './scim-auth.guard';
import { ScimService } from './scim.service';
import { type ScimUserDto, type ScimGroupDto, type ScimPatchOp } from './dto/scim.dto';

@ApiTags('scim')
@UseGuards(ScimAuthGuard)
@Controller('scim/v2')
export class ScimController {
  constructor(private readonly scimService: ScimService) {}

  private tenantId(req: Request): string {
    return req.headers['x-tenant-id'] as string ?? 'default';
  }

  // ─── ServiceProviderConfig ────────────────────────────────────────────────

  @Get('ServiceProviderConfig')
  getServiceProviderConfig() {
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
      patch: { supported: true },
      bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
      filter: { supported: true, maxResults: 200 },
      changePassword: { supported: false },
      sort: { supported: false },
      authenticationSchemes: [{
        type: 'oauthbearertoken',
        name: 'OAuth Bearer Token',
        description: 'Authentication using an OAuth Bearer Token',
      }],
    };
  }

  @Get('Schemas')
  @ApiExcludeEndpoint()
  getSchemas() {
    return { schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'], totalResults: 0, Resources: [] };
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  @Get('Users')
  listUsers(
    @Req() req: Request,
    @Query('filter') filter?: string,
    @Query('startIndex') startIndex = '1',
    @Query('count') count = '100',
  ) {
    return this.scimService.listUsers(
      this.tenantId(req),
      filter,
      parseInt(startIndex, 10),
      parseInt(count, 10),
    );
  }

  @Post('Users')
  @HttpCode(HttpStatus.CREATED)
  createUser(@Req() req: Request, @Body() dto: ScimUserDto) {
    return this.scimService.createUser(this.tenantId(req), dto);
  }

  @Get('Users/:id')
  getUser(@Req() req: Request, @Param('id') id: string) {
    return this.scimService.getUser(this.tenantId(req), id);
  }

  @Put('Users/:id')
  replaceUser(@Req() req: Request, @Param('id') id: string, @Body() dto: ScimUserDto) {
    return this.scimService.replaceUser(this.tenantId(req), id, dto);
  }

  @Patch('Users/:id')
  patchUser(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('Operations') operations: ScimPatchOp[],
  ) {
    return this.scimService.patchUser(this.tenantId(req), id, operations ?? []);
  }

  @Delete('Users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(@Req() req: Request, @Param('id') id: string) {
    return this.scimService.deleteUser(this.tenantId(req), id);
  }

  // ─── Groups ───────────────────────────────────────────────────────────────

  @Get('Groups')
  listGroups(
    @Req() req: Request,
    @Query('filter') filter?: string,
    @Query('startIndex') startIndex = '1',
    @Query('count') count = '100',
  ) {
    return this.scimService.listGroups(
      this.tenantId(req),
      filter,
      parseInt(startIndex, 10),
      parseInt(count, 10),
    );
  }

  @Post('Groups')
  @HttpCode(HttpStatus.CREATED)
  createGroup(@Req() req: Request, @Body() dto: ScimGroupDto) {
    return this.scimService.createGroup(this.tenantId(req), dto);
  }

  @Get('Groups/:id')
  getGroup(@Req() req: Request, @Param('id') id: string) {
    return this.scimService.getGroup(this.tenantId(req), id);
  }

  @Put('Groups/:id')
  replaceGroup(@Req() req: Request, @Param('id') id: string, @Body() dto: ScimGroupDto) {
    return this.scimService.replaceGroup(this.tenantId(req), id, dto);
  }

  @Delete('Groups/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteGroup(@Req() req: Request, @Param('id') id: string) {
    return this.scimService.deleteGroup(this.tenantId(req), id);
  }

  // ─── Token management ─────────────────────────────────────────────────────

  @Post('token')
  @HttpCode(HttpStatus.CREATED)
  async generateToken(@Req() req: Request, @Res() res: Response) {
    const token = await this.scimService.generateScimToken(this.tenantId(req));
    return res.json({ token, message: 'Store this token securely — it will not be shown again.' });
  }
}
