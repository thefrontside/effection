import React from "react";
// import SearchBar from "@theme/SearchBar"; // TODO: look into search bar requirements
import { useThemeConfig } from "@docusaurus/theme-common";
import Link from "@docusaurus/Link";
import LogoSelect from './logo-select';

import {
  navBar,
  navLink,
} from './navbar.css';

function Navbar() {
  let {
    navbar: { items, title },
  } = useThemeConfig();

  // https://github.com/facebook/docusaurus/issues/7505#issuecomment-1138589476
  // The `nav` requires a classname `navbar` that the classic theme is looking for
  // otherwise we get a `Cannot read properties of null (reading 'clientHeight')` error
  return (
    <nav className={`navbar ${navBar[title]}`}>
      <LogoSelect currentProject={title} />
      <div>
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {!!item.to ? (
              <Link to={item.to} className={navLink}>
                {item.label}
              </Link>
            ) : (
              <a
                href={item.href}
                className={navLink}
                target="_blank"
                rel="noreferrer noopener"
              >
                {item.label}
              </a>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
