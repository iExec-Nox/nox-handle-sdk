export const VIEW_ACL_QUERY = `
  query viewACL($handleId: Bytes!) {
    handle(id: $handleId) {
      isPubliclyDecryptable
      roles {
        account
        role
      }
    }
  }
`;
