// A document navigation drops cached private React state after sign-out.
export function navigateAfterSignOut() {
  window.location.replace("/login");
}
