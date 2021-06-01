// ==UserScript==
// @name         UNF Minimap
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Pixelplanet minimap for unf
// @author       Some Anon
// @match        https://pixelplanet.fun/*
// @match        http://pixelplanet.fun/*
// @grant        none
// ==/UserScript==

Number.prototype.between = function(a, b) {
    var min = Math.min.apply(Math, [a, b]),
      max = Math.max.apply(Math, [a, b]);
    return this > min && this < max;
  };
  var range = 25;
  window.baseTepmlateUrl = 'https://raw.githubusercontent.com/AsumaPT/unf/main/';

  window.addEventListener('load', function () {

      //Regular Expression to get coordinates out of URL
      let re = /(.*)\/\?p=(\-?(?:\d*)),(\-?(?:\d*))/g;
      //Regular Expression to get coordinates from cursor
      let rec = /x\:(\d*) y\:(\d*)/g;
      let gameWindow = document.getElementsByClassName("viewport")[0];
      if (document.getElementById("palettebox")) {
          let paleta = document.getElementById("palettebox").querySelectorAll("*");
      } else {
          document.getElementById("palselbutton").click();
      }
      let paleta = document.getElementById("palettebox").querySelectorAll("*");
      //DOM element of the displayed X, Y variables
      let coorDOM = null;
      findCoor();
      //coordinates of the middle of the window
      let x_window = 0;
      let y_window = 0;

      let height = localStorage.getItem('altura');
      let width = localStorage.getItem('largura');
      //coordinates of cursor
      let x = 0;
      let y = 0;
      //list of all available templates
      let template_list = null;
      let zoomlevel = 9;
      let cor = localStorage.getItem('corcursor');
      //toggle options
      let toggle_show = true;
      let toggle_follow = true; //if minimap is following window, x_window = x and y_window = y;
      let toggle_grid = localStorage.getItem('gridminimapa');
      let autocolor = localStorage.getItem('autocolor');
      let zooming_in = false;
      let zooming_out = false;
      let zoom_time = 100;
      //array with all loaded template-images
      let image_list = [];
      let counter = 0;
      //templates which are needed in the current area
      let needed_templates = null;
      //Cachebreaker to force refresh
      let cachebreaker = null;
      let config_show = false;

      var div = document.createElement('div');
      div.setAttribute('class', 'post block bc2');
      div.innerHTML = '<div id="minimapbg" style="position: absolute; right: 0em; top: 0em">' +
          '<div class="posy" id="posyt" style="background-color: rgba(0, 0, 0, 0.65); color: rgb(250, 250, 250); text-align: center; line-height: 42px; vertical-align: middle; width: auto; height: auto; border-radius: 3px; padding: 1px;">' +
          '<div id="minimap-text" style="display: none;"></div>' +
          '<div id="minimap-box" style="position: relative;width: 420px; height:270px">' +
          '<canvas id="minimap" style="width: 100%; height: 100%;z-index:1;position:absolute;top:0;left:0;"></canvas>' +
          '<canvas id="minimap-board" style="width: 100%; height: 100%; z-index:2;position:absolute;top:0;left:0;"></canvas>' +
          '<canvas id="minimap-cursor" style="width: 100%; height: 100%;z-index:3;position:absolute;top:0;left:0;"></canvas>' +
          '</div><div id="minimap-config" style="line-height:28px;background-color: rgba(0, 0, 0, 0.68);">' +
          '<span id="hide-map" style="cursor:pointer;color:white"> Hide Minimap' +
          '</span> | <span id="config" style="cursor:pointer;">Settings ' +
          '</span>| Zoom: <span id="zoom-plus" style="cursor:pointer;font-weight:bold;">+</span> / ' +
          '<span id="zoom-minus" style="cursor:pointer;font-weight:bold;">-</span>' +
          '</div>' +
          '</div>';

      var config = document.createElement('div');
      config.innerHTML = '<div id="configbg" style="display: none; padding:4px;z-index: 4;position:absolute;top:50%;left:50%;transform: translate(-50%, -50%);background-color: rgba(0, 0, 0, 0.75); height: 200px; width: 250px;border-radius: 3px; padding: 1px;">'+
          '<div id="title" style="background-color: rgba(0, 0, 0, 0.68);">'+
          '<span id="fechar" style="position:absolute; top:4px;right:10px;color:red;font-weight:bold;cursor:pointer;">X</span>' +
          '<span style="position:absolute;color:white; top:4px;left:10px; font-weight: 1.7em; font-size: 1.0em;">Settings</span>' + '<br>' +
          '<hr>'+
          '</div>' +
          '<div style="padding-left:10px; color: white; font-size: 0.9em">'+
          '<span>Cursor: </span>' + '<input type="color" id="corcursor" style="position:absolute;border: none;width: 32px; height: 15px; right:10px;">' + '<br>' +
          '<span>Grid: </span>' + '<span id="gridmostrar" style="position:absolute;right:10px; color: #04ff00; font-weight:bold;cursor: pointer;">ON</span>' + '<br>' +
          '<span>Autocolor: </span>' + '<span id="autocolor" style="position:absolute;right:10px; color: red; font-weight:bold;cursor: pointer;">OFF</span>' + '<br>' +
          '<span>Height: </span>' + '<input type="number" id="altura" style="position:absolute;border: none;width: 40px; height: 15px; right:29px;background: none; border: none;outline: none; border-bottom: 2px solid white; color:white;">' + '<span style="position:absolute;right:10px; font-weight:bold;">px</span>'+'<br>' +
          '<span>Width: </span>' + '<input type="number" id="largura" style="position:absolute;border: none;width: 40px; height: 15px; right:29px;background: none; border: none;outline: none; border-bottom: 2px solid white; color:white;">' + '<span style="position:absolute;right:10px; font-weight:bold;">px</span>'+'<br>' +
          '</div>'+
          '</div>';
      document.body.appendChild(config);
      document.body.appendChild(div);
      minimap = document.getElementById("minimap");
      minimap_board = document.getElementById("minimap-board");
      minimap_cursor = document.getElementById("minimap-cursor");
      minimap.width = minimap.offsetWidth;
      minimap_board.width = minimap_board.offsetWidth;
      minimap_cursor.width = minimap_cursor.offsetWidth;
      minimap.height = minimap.offsetHeight;
      minimap_board.height = minimap_board.offsetHeight;
      minimap_cursor.height = minimap_cursor.offsetHeight;
      ctx_minimap = minimap.getContext("2d");
      ctx_minimap_board = minimap_board.getContext("2d");
      ctx_minimap_cursor = minimap_cursor.getContext("2d");

      //No Antialiasing when scaling!
      ctx_minimap.mozImageSmoothingEnabled = false;
      ctx_minimap.webkitImageSmoothingEnabled = false;
      ctx_minimap.msImageSmoothingEnabled = false;
      ctx_minimap.imageSmoothingEnabled = false;


      function clicarcor(cor) {
            switch(cor) {
                case '255, 255, 255': //
                    paleta[0].click();
                    break;
                case '228, 228, 228': //
                    paleta[1].click();
                    break;
                case '196, 196, 196': //
                    paleta[2].click();
                    break;
                case '136, 136, 136': //
                    paleta[3].click();
                    break;
                case '78, 78, 78': //
                    paleta[4].click();
                    break;
                case '0, 0, 0': //
                    paleta[5].click();
                    break;
                case '244, 179, 174': //
                    paleta[6].click();
                    break;
                case '255, 167, 209': //
                    paleta[7].click();
                    break;
                case '255, 84, 178': //
                    paleta[8].click();
                    break;
                case '255, 101, 101': //
                    paleta[9].click();
                    break;
                case '229, 0, 0': //
                    paleta[10].click();
                    break;
                case '154, 0, 0': //
                    paleta[11].click();
                    break;
                case '254, 164, 96': //
                    paleta[12].click();
                    break;
                case '229, 149, 0': //
                    paleta[13].click();
                    break;
                case '160, 106, 66':
                    paleta[14].click();
                    break;
                case '96, 64, 40':
                    paleta[15].click();
                    break;
                case '245, 223, 176':
                    paleta[16].click();
                    break;
                case '255, 248, 137':
                    paleta[17].click();
                    break;
                case '229, 217, 0':
                    paleta[18].click();
                    break;
                case '148, 224, 68':
                    paleta[19].click();
                    break;
                case '2, 190, 1':
                    paleta[20].click();
                    break;
                case '104, 131, 56':
                    paleta[21].click();
                    break;
                case '0, 101, 19':
                    paleta[22].click();
                    break;
                case '202, 227, 255':
                    paleta[23].click();
                    break;
                case '0, 131, 199':
                    paleta[24].click();
                    break;
                case '0, 211, 221':
                    paleta[25].click();
                    break;
                case '0, 0, 234':
                    paleta[26].click();
                    break;
                case '25, 25, 115':
                    paleta[27].click();
                    break;
                case '207, 110, 228':
                    paleta[28].click();
                    break;
                case '130, 0, 128':
                    paleta[29].click();
                    break;
                default:
                    console.log("Image not converted.");
                    break;
            }
        }

      adaptartela();
      drawBoard();
      drawCursor(cor);

      document.getElementById("altura").onkeyup = function() {
          height = document.getElementById("altura").value;
          localStorage.setItem("altura", height)
          document.getElementById("minimap-box").style.height = height+'px';
      };

      document.getElementById("largura").onkeyup = function() {
          width = document.getElementById("largura").value;
          localStorage.setItem("largura", width)
          document.getElementById("minimap-box").style.width = width+'px';

      };
      document.getElementById("autocolor").onclick = function () {
          let texto = document.getElementById("autocolor").innerText;
          if (texto == "ON") {
              document.getElementById("autocolor").innerText = "OFF";
              document.getElementById("autocolor").style.color = "red";
              localStorage.setItem('autocolor', false);
              autocolor = false
          } else if (texto == "OFF"){
              document.getElementById("autocolor").innerText = "ON";
              document.getElementById("autocolor").style.color = "#04ff00";
              localStorage.setItem('autocolor', true);
              autocolor = true
          }
      };

      document.getElementById("gridmostrar").onclick = function () {
          let texto = document.getElementById("gridmostrar").innerText;
          if (texto == "ON") {
              document.getElementById("gridmostrar").innerText = "OFF";
              document.getElementById("gridmostrar").style.color = "red";
              localStorage.setItem('gridminimapa', false);
              toggle_grid = false
          } else if (texto == "OFF"){
              document.getElementById("gridmostrar").innerText = "ON";
              document.getElementById("gridmostrar").style.color = "#04ff00";
              localStorage.setItem('gridminimapa', true);
              toggle_grid = true
          }
          drawBoard();
      };
      document.getElementById("corcursor").onchange = function () {
          alterarcursor();
      };

      document.getElementById("hide-map").onclick = function () {
          console.log("This should do something, but it doesn't");
          toggle_show = false;
          document.getElementById("minimap-box").style.display = "none";
          document.getElementById("minimap-config").style.display = "none";
          document.getElementById("minimap-text").style.display = "block";
          document.getElementById("posyt").style.borderRadius= "21px";
          document.getElementById("minimapbg").style.top = "0.5em";
          document.getElementById("minimapbg").style.right = "0.5em";
          document.getElementById("minimap-text").style.padding = "6px";
          document.getElementById("minimap-text").innerHTML = "Show Minimap";
          document.getElementById("minimap-text").style.cursor = "pointer";
      };

      document.getElementById("autocolor").onmouseover = function () {
         let texto = document.getElementById("autocolor").innerText;
         if (texto == "ON") {
             document.getElementById("autocolor").style.color="#0dbf00";
         } else {
             document.getElementById("autocolor").style.color="darkred";
         }
      };

      document.getElementById("autocolor").onmouseout = function () {
         let texto = document.getElementById("autocolor").innerText;
         if (texto == "ON") {
             document.getElementById("autocolor").style.color="#04ff00";
         } else {
             document.getElementById("autocolor").style.color="red";
         }
      };

      document.getElementById("gridmostrar").onmouseover = function () {
         let texto = document.getElementById("gridmostrar").innerText;
         if (texto == "ON") {
             document.getElementById("gridmostrar").style.color="#0dbf00";
         } else {
             document.getElementById("gridmostrar").style.color="darkred";
         }
      };

      document.getElementById("gridmostrar").onmouseout = function () {
         let texto = document.getElementById("gridmostrar").innerText;
         if (texto == "ON") {
             document.getElementById("gridmostrar").style.color="#04ff00";
         } else {
             document.getElementById("gridmostrar").style.color="red";
         }
      };

      document.getElementById("fechar").onclick = function () {
          config_show = false;
          document.getElementById("fechar").style.top = "-1px";
          document.getElementById("fechar").style.top = "4px";
          document.getElementById("configbg").style.display = "none";

      };

      document.getElementById("fechar").onmouseover = function () {
          document.getElementById("fechar").style.color = "darkred";
      };

      document.getElementById("fechar").onmouseout = function () {
          document.getElementById("fechar").style.color = "red";
      };

      document.getElementById("config").onclick = function () {
          if (config_show == false) {
              config_show = true;
              if (toggle_grid == "false" || toggle_grid == false || autocolor == null) {
                  document.getElementById("gridmostrar").innerText = "OFF";
                  document.getElementById("gridmostrar").style.color = "red";
              } else {
                  document.getElementById("gridmostrar").innerText = "ON";
                  document.getElementById("gridmostrar").style.color = "#04ff00";
              }
              if (autocolor == "false" || autocolor == false || autocolor == null) {
                  document.getElementById("autocolor").innerText = "OFF";
                  document.getElementById("autocolor").style.color = "red";
              } else {
                  document.getElementById("autocolor").innerText = "ON";
                  document.getElementById("autocolor").style.color = "#04ff00";
              }
              document.getElementById("configbg").style.display = "block";
          } else {
              config_show = false;
              document.getElementById("configbg").style.display = "none";
          }


      };

      document.getElementById("minimap-text").onclick = function () {
          toggle_show = true;
          document.getElementById("minimap-box").style.display = "block";
          document.getElementById("minimap-config").style.display = "block";
          document.getElementById("posyt").style.borderRadius= "3px";
          document.getElementById("minimapbg").style.top = "0em";
          document.getElementById("minimapbg").style.right = "0em";
          document.getElementById("minimap-text").style.display = "none";
          document.getElementById("minimap-text").style.cursor = "default";
          loadTemplates();
      };
      document.getElementById("zoom-plus").addEventListener('mousedown', function (e) {
          e.preventDefault();
          zooming_in = true;
          zooming_out = false;
          zoomIn();
      }, false);
      document.getElementById("zoom-minus").addEventListener('mousedown', function (e) {
          e.preventDefault();
          zooming_out = true;
          zooming_in = false;
          zoomOut();
      }, false);
      document.getElementById("zoom-plus").addEventListener('mouseup', function (e) {
          zooming_in = false;
      }, false);
      document.getElementById("zoom-minus").addEventListener('mouseup', function (e) {
          zooming_out = false;
      }, false);
      gameWindow = document.getElementById("gameWindow");
      document.getElementsByClassName("viewport")[0].addEventListener('mouseup', function (evt) {
          if (!toggle_show)
              return;
          if (!toggle_follow)
              setTimeout(getCenter, 100);
      }, false);

      document.getElementsByClassName("viewport")[0].addEventListener('mousemove', function (evt) {
          if (!toggle_show)
              return;
          coorDOM = document.getElementsByClassName("coorbox")[0];
          coordsXY = coorDOM.innerHTML.split(/(-?\d+)/)
          x_new = (coordsXY[0].substring(2) + coordsXY[1])*1
          y_new = (coordsXY[2].substring(3) + coordsXY[3])*1;
          if (autocolor == true || autocolor == "true") {
              if (document.getElementById("minimap-box").style.display !== "none") {
                  var x_left = x_window * 1 - minimap.width / zoomlevel / 2;
                  var x_right = x_window * 1 + minimap.width / zoomlevel / 2;
                  var y_top = y_window * 1 - minimap.height / zoomlevel / 2;
                  var y_bottom = y_window * 1 + minimap.height / zoomlevel / 2;
                  let c = ctx_minimap.getImageData(minimap.width/2, minimap.height/2, 1, 1).data;
                  if (document.getElementById("palettebox")) {

                      if (c[3] > 0) {
                          let core = c[0]+','+' '+c[1]+','+' '+c[2];
                          console.log(core)
                          clicarcor(core);
                      }

                  } else {
                      document.getElementById("palselbutton").click();
                      paleta = document.getElementById("palettebox").querySelectorAll("*");
                  }
              }
          }

          if (x != x_new || y != y_new) {
              x = parseInt(x_new);
              y = parseInt(y_new);
              if (toggle_follow) {
                  x_window = x;
                  y_window = y;
              } else {
                  drawCursor();
              }
              loadTemplates();
          }

      }, false);

  function adaptartela() {
      if (width == null || height == null) {
          document.getElementById("altura").value = 270;
          document.getElementById("largura").value = 420;
          return
      } else {
          document.getElementById("altura").value = height;
          document.getElementById("largura").value = width;
          drawBoard();
          drawCursor(cor);
          loadTemplates();

      }

  }

  function updateloop() {
      console.log("Updating Template List");
      // Get JSON of available templates
      var xmlhttp = new XMLHttpRequest();
      var url = window.baseTepmlateUrl + "templates/data.json?" + new Date().getTime();
      xmlhttp.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
              template_list = JSON.parse(this.responseText);
              if (!toggle_follow)
                  getCenter();
          }
      };
      xmlhttp.open("GET", url, true);
      xmlhttp.send();

      console.log("Refresh got forced.");
      image_list = [];
      loadTemplates();

      setTimeout(updateloop, 60000)
  }

  function alterarcursor() {
      cor = document.getElementById("corcursor").value;
      localStorage.setItem('corcursor', cor)
      drawCursor(cor);
  };

  function toggleShow() {
      toggle_show = !toggle_show;
      if (toggle_show) {
          document.getElementById("minimap-box").style.display = "block";
          document.getElementById("minimap-config").style.display = "block";
          document.getElementById("minimap-text").style.display = "none";
          document.getElementById("minimapbg").onclick = function () {
          };
          loadTemplates();
      } else {
          document.getElementById("minimap-box").style.display = "none";
          document.getElementById("minimap-config").style.display = "none";
          document.getElementById("minimap-config").style.display = "none";
          document.getElementById("minimap-boxt").style.padding = "6px";
          document.getElementById("minimap-text").innerHTML = "Mostrar Minimap";
          document.getElementById("minimapbg").onclick = function () {
              toggleShow()
          };
      }
  }

  function zoomIn() {
      if (!zooming_in)
          return;
      zoomlevel = zoomlevel * 1.1;
      if (zoomlevel > 45) {
          zoomlevel = 45;
          return;
      }
      drawBoard();
      drawCursor(cor);
      loadTemplates();
      setTimeout(zoomIn, zoom_time);
  }

  function zoomOut() {
      if (!zooming_out)
          return;
      zoomlevel = zoomlevel / 1.1;
      if (zoomlevel < 1) {
          zoomlevel = 1;
          return;
      }
      drawBoard();
      drawCursor(cor);
      loadTemplates();
      setTimeout(zoomOut, zoom_time);
  }

  function loadTemplates() {
      if (!toggle_show)
          return;
      if (template_list == null)
          return;

      var x_left = x_window * 1 - minimap.width / zoomlevel / 2;
      var x_right = x_window * 1 + minimap.width / zoomlevel / 2;
      var y_top = y_window * 1 - minimap.height / zoomlevel / 2;
      var y_bottom = y_window * 1 + minimap.height / zoomlevel / 2;
      //console.log("x_left : " + x_left);
      //console.log("x_right : " + x_right);
      //console.log("y_top : " + y_top);
      //console.log("y_bottom : " + y_bottom);
      //console.log(template_list);
      var keys = [];
      for (var k in template_list) keys.push(k);
      needed_templates = [];
      var i;
      for (i = 0; i < keys.length; i++) {
          template = keys[i];

          var temp_x = parseInt(template_list[template]["x"]) * 1;
          var temp_y = parseInt(template_list[template]["y"]) * 1;
          var temp_xr = parseInt(template_list[template]["x"]) + parseInt(template_list[template]["width"]);
          var temp_yb = parseInt(template_list[template]["y"]) + parseInt(template_list[template]["height"]);
          // if (temp_xr <= x_left || temp_yb <= y_top || temp_x >= x_right || temp_y >= y_bottom)
          //    continue
          if (!x_window.between(temp_x-range*1, temp_xr+range*1))
              continue
          if (!y_window.between(temp_y-range*1, temp_yb+range*1))
              continue

          needed_templates.push(template);
      }
      if (needed_templates.length == 0) {
          if (zooming_in == false && zooming_out == false) {
              document.getElementById("minimap-box").style.display = "none";
              document.getElementById("minimap-text").style.display = "block";
              document.getElementById("minimap-text").innerHTML = "No template here.";
              document.getElementById("minimapbg").style.top = "0.5em";
              document.getElementById("minimapbg").style.right = "0.5em";
              document.getElementById("minimap-text").style.padding = "6px";
              document.getElementById("minimap-config").style.display = "none";
          }
      } else {
          document.getElementById("minimap-box").style.display = "block";
          document.getElementById("minimap-text").style.display = "none";
          document.getElementById("minimapbg").style.top = "0em";
          document.getElementById("minimapbg").style.right = "0em";
          document.getElementById("minimap-text").style.padding = "3px";
          document.getElementById("minimap-config").style.display = "block";
          counter = 0;
          for (i = 0; i < needed_templates.length; i++) {
              if (image_list[needed_templates[i]] == null) {
                  loadImage(needed_templates[i]);
              } else {
                  counter += 1;
                  //if last needed image loaded, start drawing
                  if (counter == needed_templates.length)
                      drawTemplates();
              }
          }
      }
  }

  function loadImage(imagename) {
      console.log("    Load image " + imagename);
      image_list[imagename] = new Image();
      if (cachebreaker != null)
          image_list[imagename].src = window.baseTepmlateUrl +"images/"+template_list[imagename].name;
      else
          image_list[imagename].src = window.baseTepmlateUrl +"images/"+ template_list[imagename].name;
      image_list[imagename].onload = function () {
          counter += 1;
          //if last needed image loaded, start drawing
          if (counter == needed_templates.length)
              drawTemplates();
      }
  }

  function drawTemplates() {
      ctx_minimap.clearRect(0, 0, minimap.width, minimap.height);
      var x_left = x_window * 1 - minimap.width / zoomlevel / 2;
      var y_top = y_window * 1 - minimap.height / zoomlevel / 2;
      var i;
      for (i = 0; i < needed_templates.length; i++) {
          var template = needed_templates[i];
          var xoff = (template_list[template]["x"] * 1 - x_left * 1) * zoomlevel;
          var yoff = (template_list[template]["y"] * 1 - y_top * 1) * zoomlevel;
          var newwidth = zoomlevel * image_list[template].width;
          var newheight = zoomlevel * image_list[template].height;
          var img = image_list[template];
          img.crossOrigin = "Anonymous"
          ctx_minimap.drawImage(img, xoff, yoff, newwidth, newheight);

      }
  }

  function drawBoard() {
      ctx_minimap_board.clearRect(0, 0, minimap_board.width, minimap_board.height);
      if (toggle_grid == "false" || toggle_grid == false) {
          return;
      } else if (toggle_grid == "true" || toggle_grid == true || toggle_grid == null){
          ctx_minimap_board.beginPath();
          var bw = minimap_board.width + zoomlevel;
          var bh = minimap_board.height + zoomlevel;
          var xoff_m = (minimap.width / 2) % zoomlevel - zoomlevel;
          var yoff_m = (minimap.height / 2) % zoomlevel - zoomlevel;
          var z = 1 * zoomlevel;

          for (var x = 0; x <= bw; x += z) {
              ctx_minimap_board.moveTo(x + xoff_m, yoff_m);
              ctx_minimap_board.lineTo(x + xoff_m, bh + yoff_m);
          }

          for (var x = 0; x <= bh; x += z) {
              ctx_minimap_board.moveTo(xoff_m, x + yoff_m);
              ctx_minimap_board.lineTo(bw + xoff_m, x + yoff_m);
          }
          ctx_minimap_board.lineWidth = zoomlevel / 20;
          ctx_minimap_board.strokeStyle = "black";
          ctx_minimap_board.stroke();
     }
  }

  function drawCursor(cor='red') {
      var x_left = x_window * 1 - minimap.width / zoomlevel / 2;
      var x_right = x_window * 1 + minimap.width / zoomlevel / 2;
      var y_top = y_window * 1 - minimap.height / zoomlevel / 2;
      var y_bottom = y_window * 1 + minimap.height / zoomlevel / 2;
      ctx_minimap_cursor.clearRect(0, 0, minimap_cursor.width, minimap_cursor.height);
      if (x < x_left || x > x_right || y < y_top || y > y_bottom)
          return
      xoff_c = x - x_left;
      yoff_c = y - y_top;

      ctx_minimap_cursor.beginPath();
      ctx_minimap_cursor.lineWidth = zoomlevel / 3;
      ctx_minimap_cursor.strokeStyle = cor;
      ctx_minimap_cursor.rect(zoomlevel * xoff_c, zoomlevel * yoff_c, zoomlevel, zoomlevel);
      ctx_minimap_cursor.stroke();

  }

  function getCenter() {
      var url = window.location.href;
      x_window = url.replace(re, '$2');
      y_window = url.replace(re, '$3');
      if (x_window == url || y_window == url) {
          x_window = 0;
          y_window = 0;
      }
      loadTemplates();
  }

  function findCoor() {
      //all elements with style attributes
      var elms = document.querySelectorAll("*[style]");
      // Loop and find the element with the right style attributes
      /*Array.prototype.forEach.call(elms, function (elm) {
          var style = elm.style.cssText;
          if (style == "position: absolute; left: 1em; bottom: 1em;") {
              console.log("Found It!");
              coorDOM = elm.firstChild;
              console.log(coorDOM.innerHTML);
          }
      });*/
      coorDOM = document.getElementsByClassName("coorbox")[0];
    }
    updateloop();
  },false )
