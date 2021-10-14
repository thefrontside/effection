import React from "react";
// import SearchBar from "@theme/SearchBar"; // TODO: look into search bar requirements
import { useThemeConfig } from "@docusaurus/theme-common";
import Link from "@docusaurus/Link";
import { useSelect } from 'downshift';

import Logo from "@theme/Logo";
import DropdownArrow from './dropdown-arrow';

import {
  navBar,
  navLink,
  logoCol,
  projectsList,
  projectItem,
  projectItemHighlighted,
  projectTitle,
  projectDescription,
  labelDropdown,
  projectCurrent,
  arrowDropdownButton
} from './navbar.css';

const items = [
  {
    title: 'Interactors',
    description: 'Page Objects for components libraries',
    url: 'https://frontside.com/interactors',
  },
  {
    title: 'Effection',
    description: 'Structured Concurrency for JavaScript',
    url: 'https://frontside.com/effection',
  },
  {
    title: 'Bigtest',
    description: 'Universal test runner using GraphQL',
    url: 'https://frontside.com/bigtest',
  }
];

function ProjectSelect({ currentProject }) {
  let {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
  } = useSelect({ items, itemToString: (item => item.title), initialSelectedItem: 0 })
  return (
    <div className={logoCol}>
      <Logo />
      <label className={labelDropdown} {...getLabelProps()}>Choose an element:</label>
      <button type="button" className={arrowDropdownButton} {...getToggleButtonProps()}>
        <DropdownArrow />
      </button>
      <ul className={projectsList} {...getMenuProps()}>
        {isOpen &&
          items.map((item, index) => (
            <li
              key={`${item}${index}`}
              className={highlightedIndex === index ? projectItemHighlighted : projectItem}
              {...getItemProps({ item, index })}
            >
              {currentProject !== item.title ?
                <a href={item.url}>
                  <span className={projectTitle}>
                    {item.title}
                  </span>
                  <span className={projectDescription}>{item.description}</span>
                </a>
                :
                <Link to={'/'}>
                  <span className={projectCurrent[item.title]}>
                    {item.title}
                  </span>
                  <span className={projectDescription}>{item.description}</span>
                </Link>
              }

            </li>
          ))}
      </ul>
    </div>
  )
}

function Navbar() {
  let {
    navbar: { items, title },
  } = useThemeConfig();

  return (
    <nav className={navBar[title]}>
      <ProjectSelect currentProject={title} />
      <div>
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {(!!item.to ? (
              <Link to={item.to} className={navLink}>{item.label}</Link>
            ) : (
              <a href={item.href} className={navLink} target="_blank" rel="noreferrer noopener">{item.label}</a>
            ))}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
