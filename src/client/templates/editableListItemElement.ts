export function editableListItemElement(name: string) {
  const nameInputEl = document.createElement("input");
  nameInputEl.type = "text";
  nameInputEl.name = "name";
  nameInputEl.value = name;

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "␡";
  deleteBtn.title = "delete";
  deleteBtn.classList.add("delete");

  const liEl = document.createElement("li");
  liEl.classList.add("editable");
  liEl.append(nameInputEl, deleteBtn);
  return liEl;
}
