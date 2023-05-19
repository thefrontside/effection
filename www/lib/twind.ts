import type { Tag } from "html";
import type { Document, HTMLTemplateElement } from "dom";
import { setup, tw } from "https://esm.sh/twind@0.16.16";
import { getStyleTag, virtualSheet } from "https://esm.sh/twind@0.16.16/sheets";

const sheet = virtualSheet();

setup({ sheet });

export function twind(tag: Tag<string>, doc: Document): void {
  sheet.reset();
  visit(tag);

  let styleTag = getStyleTag(sheet);

  let template = doc.createElement("template") as HTMLTemplateElement;
  template.innerHTML = styleTag;

  doc.head.appendChild(template.content.firstChild);
}

function visit(tag: Tag<string>): void {
  let { attrs: { class: classnames }, children } = tag;
  if (classnames) {
    tw(classnames);
  }
  for (let child of children) {
    if (typeof child !== "string") {
      visit(child);
    }
  }
}
