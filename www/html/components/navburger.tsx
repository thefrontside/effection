//@ts-nocheck hastx does not currently typecheck <svg> correctly
export function Navburger() {
  return (
    <svg
      class="inline-block h-4 w-4 fill-current fixed mt-2.5 right-2.5"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Mobile menu</title>
      <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
    </svg>
  );
}
