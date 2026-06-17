// SCIM 2.0 Type Definitions
// RFC 7643 / RFC 7644

export interface ScimUser {
  schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'];
  id: string;
  externalId?: string;
  userName: string;
  name: {
    givenName: string;
    familyName: string;
    formatted?: string;
  };
  emails: Array<{ value: string; primary: boolean; type?: string }>;
  active: boolean;
  meta: {
    resourceType: 'User';
    created: string;
    lastModified: string;
    location: string;
    version?: string;
  };
}

export interface ScimGroup {
  schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'];
  id: string;
  externalId?: string;
  displayName: string;
  members: Array<{ value: string; display: string; $ref?: string }>;
  meta: {
    resourceType: 'Group';
    created: string;
    lastModified: string;
    location: string;
    version?: string;
  };
}

export interface ScimListResponse<T> {
  schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: T[];
}

export interface ScimPatchOp {
  op: 'add' | 'remove' | 'replace';
  path?: string;
  value?: unknown;
}

export interface ScimPatchRequest {
  schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'];
  Operations: ScimPatchOp[];
}

export interface ScimUserDto {
  schemas?: string[];
  externalId?: string;
  userName: string;
  name?: {
    givenName?: string;
    familyName?: string;
    formatted?: string;
  };
  emails?: Array<{ value: string; primary?: boolean; type?: string }>;
  active?: boolean;
  displayName?: string;
  // Azure AD / Okta extension attributes
  [key: string]: unknown;
}

export interface ScimGroupDto {
  schemas?: string[];
  externalId?: string;
  displayName: string;
  members?: Array<{ value: string; display?: string }>;
}

export interface ScimError {
  schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'];
  status: number;
  scimType?: string;
  detail?: string;
}
