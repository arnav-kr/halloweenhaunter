function form(e) {
  e.preventDefault();
  document.getElementById("haunt").disabled = true;
  var f = e.target;
  var action = f.getAttribute("action"),
    method = f.getAttribute("method"),
    contentType = f.getAttribute("enctype"),
    fields = f.dataset.fields.split(","),
    fieldsData = {};
  for (item in fields) {
    if (f[fields[item]].getAttribute("type") == "checkbox") {
      fieldsData[fields[item].toLowerCase()] = f[fields[item]].value == "on" ? true : false;
      continue;
    }
    fieldsData[fields[item].toLowerCase()] = f[fields[item]].value;
  }
  fetch(action, {
    "method": method,
    "headers": {
      'Content-Type': contentType
    },
    "body": JSON.stringify(fieldsData)
  })
    .then(r => r.json())
    .catch(err => {
      console.log(err);
      document.getElementById("haunt").disabled = false;
    })
    .then(res => {
      var d = res;
      console.log(JSON.stringify(d, null, 2))
      if (d.code == 200) {
        var ltr = document.getElementById("letter"), card = document.getElementById("card"), upf = document.getElementById("upf");
        card.style.bottom = "75%";
        upf.style.transformOrigin = "top";
        upf.style.transform = "rotatex(180deg)";
        upf.style.zIndex = "1";
        card.style.animation = "card_down .5s ease-in-out .2s 1 forwards";
        upf.style.animation = "flap_close .5s ease-in .8s 1 forwards";
        ltr.style.animation = "letter_send 1s ease-in-out 2.1s 1 forwards";
      }
      if (d.code == 400 || d.error) {
        console.log("An Error Occurred!");
      }
      document.getElementById("haunt").disabled = false;
    })
    .catch(err => {
      console.log(err);
      document.getElementById("haunt").disabled = false;

    })
}