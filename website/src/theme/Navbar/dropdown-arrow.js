import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={19.98}
      height={12}
      {...props}
    >
      <path
        d="M11 11c.83-.84 1.65-1.68 2.44-2.55S15 6.7 15.76 5.77A45.21 45.21 0 0020 0a45.93 45.93 0 00-5.77 4.22c-.92.74-1.78 1.55-2.66 2.33l-.16.15-1.62.88-1.2-.89-.15-.14C7.55 5.77 6.7 5 5.78 4.22A46 46 0 000 0a46 46 0 004.22 5.78C5 6.7 5.77 7.55 6.55 8.44S8.16 10.15 9 11l1 1z"
        fill="#fff"
      />
    </svg>
  )
}

export default SvgComponent
