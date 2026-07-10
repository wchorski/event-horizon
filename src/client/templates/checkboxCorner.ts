import { createElement } from "@client/elementRenders";

export function checkboxCornerEl(
  name: string,
  isChecked: boolean,
  tooltip?: string,
  size?: number,
): HTMLLabelElement {
  const labelEl = createElement("label", {
    className: "corner-checkbox",
    title: tooltip,
  });
  const tdbCheckbox = createElement("input", {
    type: "checkbox",
    name,
    checked: isChecked,
  });
  const divBgTriangle = createElement("div", {
    className: "corner-checkbox-bg",
    //@ts-ignore
    style: { "--size": size },
  });
  const iconEl = createElement("div", {
    className: "corner-checkbox-icon",
  });

  labelEl.appendChild(tdbCheckbox);
  labelEl.append(divBgTriangle, iconEl);
  return labelEl;
}
