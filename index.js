function openPopup() {
  const popDialog = document.getElementById("pswdPopUp");
  popDialog.style.visibility =
      popDialog.style.visibility ===
          "visible"
          ? "hidden"
          : "visible";
}

function checkValue(){
  const pswd = document.getElementById("pswdBox");
  if(pswd.value == "Hawklets") {
    location.href="admin.html";
  } else {
    alert("Nope, try again");
    pswd.value = "";
  };
}