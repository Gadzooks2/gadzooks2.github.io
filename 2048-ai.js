input_box.setAttribute("type", "text");
input_box.setAttribute("id", "numberOfAIs");
input_box.setAttribute("onchange", "setAIs();");
input_box.setAttribute("onkeypress", "this.onchange();");
input_box.setAttribute("onpaste", "this.onchange();");
input_box.setAttribute("oninput", "this.onchange();");
function setAIs(){
  AIs = Number(document.getElementById("numberOfAIs").value);
  RUNS = AIs;
}
