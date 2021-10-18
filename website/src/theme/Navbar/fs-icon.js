import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      data-name="Layer 1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 42.99 49.39"
      {...props}
    >
      <path
        d="M21.5 0L0 12.38V37l21.5 12.39L43 37V12.38z"
        fillRule="evenodd"
        fill="#14315d"
      />
      <path
        d="M10.75 30.88V18.64l-5.31-3.13v18.37l16.06 9.25V37z"
        fill="#f74d7b"
        fillRule="evenodd"
      />
      <path
        d="M32.11 30.88V18.64l5.3-3.13v18.37L21.5 43.13V37z"
        fill="#26abe8"
        fillRule="evenodd"
      />
      <path
        d="M32.11 18.64l5.3-3.13L21.5 6.26 5.44 15.51l5.31 3.13 3.81-2.31 10.75 6.25 5.3-3.12-10.75-6.26 1.5-.82z"
        fill="#fff"
        fillRule="evenodd"
      />
    </svg>
  )
}

export default SvgComponent
