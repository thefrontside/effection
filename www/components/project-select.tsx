export function ProjectSelect() {
  let uuid = self.crypto.randomUUID();

  let toggleId = `toggle-${uuid}`;
  let openerId = `opener-${uuid}`;
  let closerId = `closer-${uuid}`;

  return (
    <>
      <style media="all">
        {`
        #${toggleId}:checked ~ label#${openerId} > aside {
          display: none;
        }
        #${toggleId}:checked ~ label#${closerId} {
          display: none;
        }
        #${toggleId} ~ label#${closerId} {
          display: block;
        }

        #${toggleId} ~ #${openerId} li:hover {
          background: rgba(38,171,232,.1);
        }
        #${toggleId} ~ #${openerId}::after {
          display: inline-block;
          margin-left: .25em;
          color: white;
          content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" style="fill: white;" width="12" height="7.21"><path d="M5.4.61q-.75.75-1.47 1.53c-.46.53-1 1-1.4 1.6A27.54 27.54 0 000 7.21a28.64 28.64 0 003.47-2.54c.55-.44 1.06-.93 1.6-1.4l.09-.09 1-.53.71.54.09.08c.54.47 1.05 1 1.6 1.4A26.65 26.65 0 0012 7.21a27.54 27.54 0 00-2.53-3.47c-.45-.56-.94-1.07-1.4-1.6s-1-1-1.47-1.53L6 0z"></path></svg>');
        }
        #${toggleId}:checked ~ label::after {
          transform: rotate(180deg);
        }
        `}
      </style>
      <input type="checkbox" class="hidden" id={toggleId} checked />
      <label id={openerId} class="cursor-pointer" for={toggleId}>
        <span class="sm:hidden">OSS</span>
        <aside class="absolute m-4 rounded-md text-blue-primary bg-white shadow-lg sm-max:right-0 sm:left-0 z-50">
          <h4 class="p-2.5 uppercase text-sm text-center font-normal min-w-max">
            Frontside Open Source
          </h4>
          <ul>
            {projects.map((project) => (
              <li class="p-2.5">
                <a class="flex flex-nowrap gap-x-2" href={project.url}>
                  <img src={project.img} alt={`${project.title} Logo`} />
                  <section class="font-normal text-xs">
                    <h3 class="tracking-wider mb-1.5 leading-3 min-w-max">
                      <span class="font-bold uppercase">{project.title}</span>
                      {" "}
                      {project.version}
                    </h3>
                    <p>{project.description}</p>
                  </section>
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </label>

      <label
        id={closerId}
        class="absolute w-screen h-screen inset-0 z-40 hidden"
        for={toggleId}
      />
    </>
  );
}

const projects = [
  {
    title: "Interactors",
    description: "Page Objects for components libraries",
    url: "https://frontside.com/interactors",
    version: "v1",
    img:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNCIgaGVpZ2h0PSIzNCIgdmlld0JveD0iMCAwIDM0IDM0Ij4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmEgewogICAgICAgIGZpbGw6ICNmZmY7CiAgICAgIH0KCiAgICAgIC5hLCAuYiwgLmMgewogICAgICAgIHN0cm9rZTogIzE0MzA1YzsKICAgICAgICBzdHJva2UtbWl0ZXJsaW1pdDogMTA7CiAgICAgICAgc3Ryb2tlLXdpZHRoOiAycHg7CiAgICAgIH0KCiAgICAgIC5iIHsKICAgICAgICBmaWxsOiAjMjZhYmU4OwogICAgICB9CgogICAgICAuYyB7CiAgICAgICAgZmlsbDogI2Y3NGQ3YjsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPGc+CiAgICA8ZWxsaXBzZSBjbGFzcz0iYSIgY3g9IjI4LjQ1IiBjeT0iNi45MSIgcng9IjQiIHJ5PSIzLjg5Ii8+CiAgICA8cGF0aCBjbGFzcz0iYiIgZD0iTTI4LjQ1LDEwLjhhMy45NCwzLjk0LDAsMCwxLTQtMy44OSw0LDQsMCwwLDEsLjI1LTEuMzQsNi40NSw2LjQ1LDAsMCwwLTEuMzMtLjE0QTYuMyw2LjMsMCwwLDAsMTcsMTEuNjRhNi4zOCw2LjM4LDAsMCwwLDEyLjc1LDAsNi45MSw2LjkxLDAsMCwwLS4xLTFBNC4zLDQuMywwLDAsMSwyOC40NSwxMC44WiIvPgogICAgPHBhdGggY2xhc3M9ImMiIGQ9Ik0xNywxMS42NGE2LjI2LDYuMjYsMCwwLDEsLjEtMSwxMS4xMSwxMS4xMSwwLDAsMC00LjY5LTEsMTAuODIsMTAuODIsMCwwLDAtMTEsMTAuNjhBMTAuODIsMTAuODIsMCwwLDAsMTIuNDEsMzFhMTAuODMsMTAuODMsMCwwLDAsMTEtMTAuNjgsMTAuNjYsMTAuNjYsMCwwLDAtLjMxLTIuNDhBNi4yNyw2LjI3LDAsMCwxLDE3LDExLjY0WiIvPgogIDwvZz4KPC9zdmc+Cg==",
  },
  {
    title: "Effection",
    description: "Structured Concurrency for JavaScript",
    url: "/V2/",
    version: "v2",
    img:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNCIgaGVpZ2h0PSIzNCIgdmlld0JveD0iMCAwIDM0IDM0Ij4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmEgewogICAgICAgIGZpbGw6ICMxYzMwNWE7CiAgICAgIH0KCiAgICAgIC5iIHsKICAgICAgICBmaWxsOiAjMjZhYmU4OwogICAgICB9CgogICAgICAuYyB7CiAgICAgICAgZmlsbDogI2ZmZjsKICAgICAgfQoKICAgICAgLmQgewogICAgICAgIGZpbGw6ICNmNzRkN2I7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgPC9kZWZzPgogIDxnPgogICAgPHJlY3QgY2xhc3M9ImEiIHg9IjEzLjU4IiB5PSI2Ljg5IiB3aWR0aD0iMTcuMTgiIGhlaWdodD0iMTcuMTgiIHJ4PSIxLjk2IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNC40NiAyMC4yMSkgcm90YXRlKC00NSkiLz4KICAgIDxyZWN0IGNsYXNzPSJhIiB4PSI4LjM5IiB5PSIxMi4wOCIgd2lkdGg9IjE3LjE4IiBoZWlnaHQ9IjE3LjE4IiByeD0iMS45NiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkuNjQgMTguMDYpIHJvdGF0ZSgtNDUpIi8+CiAgICA8cmVjdCBjbGFzcz0iYSIgeD0iMy4yNCIgeT0iNi45NyIgd2lkdGg9IjE3LjE4IiBoZWlnaHQ9IjE3LjE4IiByeD0iMS45NiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTcuNTMgMTIuOTIpIHJvdGF0ZSgtNDUpIi8+CiAgICA8cmVjdCBjbGFzcz0iYiIgeD0iMTYuMjgiIHk9IjkuNjEiIHdpZHRoPSIxMS43OCIgaGVpZ2h0PSIxMS43OCIgcng9IjIuMjYiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC00LjQ3IDIwLjIxKSByb3RhdGUoLTQ1KSIvPgogICAgPHJlY3QgY2xhc3M9ImMiIHg9IjExLjA3IiB5PSIxNC44MSIgd2lkdGg9IjExLjc4IiBoZWlnaHQ9IjExLjc4IiByeD0iMi4yNiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkuNjcgMTguMDYpIHJvdGF0ZSgtNDUpIi8+CiAgICA8cmVjdCBjbGFzcz0iZCIgeD0iNS45NyIgeT0iOS43MSIgd2lkdGg9IjExLjc4IiBoZWlnaHQ9IjExLjc4IiByeD0iMi4yNiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTcuNTYgMTIuOTUpIHJvdGF0ZSgtNDUpIi8+CiAgPC9nPgo8L3N2Zz4K",
  },
  {
    title: "Auth0 Simulator",
    description: "Enabling testing and local development",
    url: "https://github.com/thefrontside/simulacrum/tree/v0/packages/auth0",
    version: "v0",
    img:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNCIgaGVpZ2h0PSIzNCIgdmlld0JveD0iMCAwIDM0IDM0Ij4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmEgewogICAgICAgIGZpbGw6ICMxNDMxNWQ7CiAgICAgIH0KCiAgICAgIC5iIHsKICAgICAgICBmaWxsOiAjMjZhYmU4OwogICAgICB9CgogICAgICAuYyB7CiAgICAgICAgZmlsbDogI2Y3NGQ3YjsKICAgICAgICBmaWxsLXJ1bGU6IGV2ZW5vZGQ7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgPC9kZWZzPgogIDxnPgogICAgPHBhdGggY2xhc3M9ImEiIGQ9Ik0xNyw1LjE2bDEwLjMzLDUuOTVWMjIuODlMMTcsMjguODQsNi42NywyMi44OVYxMS4xMUwxNyw1LjE2TTE3LC4yOCwyLjQ1LDguNjZWMjUuMzRMMTcsMzMuNzJsMTQuNTUtOC4zOFY4LjY2TDE3LC4yOFoiLz4KICAgIDxwYXRoIGNsYXNzPSJiIiBkPSJNMTcsNy42OWw4LjEyLDQuNjd2OS4yOEwxNywyNi4zMSw4Ljg4LDIxLjY0VjEyLjM2TDE3LDcuNjltMC0zLjI1TDYuMDYsMTAuNzRWMjMuMjZMMTcsMjkuNTZsMTAuOTQtNi4zVjEwLjc0TDE3LDQuNDRaIi8+CiAgICA8cG9seWdvbiBjbGFzcz0iYyIgcG9pbnRzPSIxNyAxMy44OCAxNC4yOCAxNS40NCAxNC4yOCAxOC41NiAxNyAyMC4xMiAxOS43MiAxOC41NiAxOS43MiAxNS40NCAxNyAxMy44OCIvPgogIDwvZz4KPC9zdmc+Cg==",
  },
];
