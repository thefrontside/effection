/** see https://github.com/denoland/deploy_feedback/issues/527#issuecomment-2510631720 */
export function patchDenoPermissionsQuerySync() {
  const permissions = {
    run: "denied",
    read: "granted",
    write: "denied",
    net: "granted",
    env: "granted",
    sys: "denied",
    ffi: "denied",
  } as const;

  Deno.permissions.querySync ??= ({ name }) => {
    return {
      state: permissions[name],
      onchange: null,
      partial: false,
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    };
  };
}