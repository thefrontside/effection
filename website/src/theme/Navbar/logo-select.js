import React from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { useSelect } from 'downshift';

import DropdownArrow from './dropdown-arrow';

import {
  logoCol,
  projectsList,
  projectItem,
  projectItemHighlighted,
  projectTitle,
  projectDescription,
  labelDropdown,
  projectCurrent,
  arrowDropdownButton,
  projectLogo,
  projectVersion,
  projectLink,
  logoTitle
} from './navbar.css';

const items = [
  {
    title: 'Interactors',
    description: 'Page Objects for components libraries',
    url: 'https://frontside.com/interactors',
    version: 'v1',
    img: '/images/icon-interactors.svg',
  },
  {
    title: 'Effection',
    description: 'Structured Concurrency for JavaScript',
    url: 'https://frontside.com/effection/V2/',
    version: 'v2',
    img: '/images/icon-effection.svg',
  },
  {
    title: 'Bigtest',
    description: 'Universal test runner, GraphQL driven',
    url: 'https://frontside.com/bigtest',
    version: 'v0',
    img: '/images/icon-bigtest.svg',
  },
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

  let curentLogo = items.find(({ title }) => title === currentProject);

  return (
    <div className={logoCol}>
      {/* <Logo /> */}
      <Link to={'/'} className={logoCol}>
        <img src={useBaseUrl(curentLogo.img)} alt="" className={projectLogo} />
        <h1 className={logoTitle}>
          {curentLogo.title}
          <span className={projectVersion}>{curentLogo.version}</span>
        </h1>
      </Link>
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
                <a href={item.url} className={projectLink}>
                  <img src={useBaseUrl(item.img)} alt="" className={projectLogo} />
                  <span>
                    <span className={projectTitle}>
                      {item.title}
                      <span className={projectVersion}>{item.version}</span>
                    </span>
                    <span className={projectDescription}>
                      {item.description}
                    </span>
                  </span>
                </a>
                :
                <Link to={'/'} className={projectLink}>
                  <img src={useBaseUrl(item.img)} alt="" className={projectLogo} />
                  <span>
                    <span className={projectCurrent[item.title]}>
                      {item.title}
                      <span className={projectVersion}>{item.version}</span>
                    </span>
                    <span className={projectDescription}>
                      {item.description}
                    </span>
                  </span>
                </Link>
              }

            </li>
          ))}
      </ul>
    </div>
  )
}

export default ProjectSelect;
