var width = window.innerWidth * 0.8;
var height = window.innerHeight * 0.95;
var ids = []
const WeightToRadius = 6;
const gojoTreshHold = 0.5;
function main(){
  var path = "hikarujinzai4.json"
  if (ids.length != 0){
    path = "http://localhost:1234/network?"
    path += ids.map(function(id){
      return "id[]="+id
    }).join("&");
  }
  d3.json(path,function(err,data){
    if(err){
      console.log(err);
    }else{
      d3.select("svg").remove();
      var links = data[0].links;
      var users = data[0].users;
      var nodes = {};
      links.forEach(function(link){
        if(!(link.source in nodes)){
          nodes[link.source] = {name:link.source};
          link.source = nodes[link.source];
        }else{
          link.source = nodes[link.source];
        }
        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target})
      });
    }

    d3.select("#searchbtn")
      .on("click",function(){
        searchButton();
      });

    var zoom = d3.behavior.zoom()
                          .scaleExtent([0.1, 10])
                          .on("zoom", zoomed);

    var drag = d3.behavior.drag()
                          .origin(function(d) { return d; })
                          .on("dragstart", dragstarted)
                          .on("drag", dragged)
                          .on("dragend", dragended);

    var svg = d3.select(".dataView")
                .append("svg")
                .attr("width",width)
                .attr("height",height)
                .call(zoom);

    var defs = svg.append("defs");

    defs.selectAll("marker")
       .data(["head"])
       .enter()
       .append("marker")
       .attr("id",function(d){
         return d;
       })
       .attr("viewBox","0 -5 10 10")
       .attr("refX",15)
       .attr("refY",0)
       .attr("markerWidth", 6)
       .attr("markerHeight", 6)
       .attr("orient", "auto")
       .append("svg:path")
       .attr("d","M0,-5L10,0L0,5");

     defs.selectAll("pattern")
         .data(Object.keys(users))
         .enter()
         .append("pattern")
         .attr("id",function(d){
           return "image_" + d;
         })
         .attr({
           width: "100%",
           height: "100%",
           x: "0%",
           y: "0%",
           viewBox: "0 0 512 512"
         })
         .append("svg:image")
         .attr("xlink:href",function(d){
           return users[d].iconURL;
         })
         .attr({
           width: 512,
           height: 512,
           x: "0%",
           y: "0%"
         });

     var graph = d3.layout.force()
                          .nodes(d3.values(nodes))
                          .links(links)
                          .size([width,height])
                          .linkDistance(function(d){
                            return 100*(1.5-d.bookmarkRate);
                          })
                          .charge(function(d){

                            return -users[d.name]["bookmarkAverage"]*10;
                          })
                          .on("tick",tick)
                          .start();

     var container = svg.append("g");

     var link = container.selectAll(".link")
                   .data(graph.links())
                   .enter()
                   .append("line")
                   .attr("fill", "none")
                   .attr("stroke", function(d){
                    if(d.bookmarkRate > gojoTreshHold){
                      return "rgba(60, 110, 194," + d.bookmarkRate + ")";
                    }else{
                      return "rgba(233, 66, 66," + d.bookmarkRate + ")";

                    }
                    return "black";
                   })
                   .attr("stroke-width","2px")
                   .attr("marker-end","url(#head)");

     var node = container.selectAll(".node")
                   .data(graph.nodes())
                   .enter()
                   .append("g")
                   .attr("fill","#CCCCCC")
                   .attr("id",function(d){
                     return "g_" + d.name;
                   })
                   .on("click",function(d){
                     viewModal(d.name);
                   });

     node.append("circle")
         .attr("r",function(d){
           if(users[d.name].bookmarkAverage > 0){
             var num = WeightToRadius * users[d.name].bookmarkAverage;
           }else{
             var num = WeightToRadius;
           }
           num = Math.sqrt(num);
           return num.toString();
         })
         .style("fill",function(d){
           return "url('#image_" + d.name + "')";
         });


      function tick(){
        link.attr("x1",function(d){return d.source.x;})
            .attr("y1",function(d){return d.source.y;})
            .attr("x2",function(d){
              return modifyLineCoordinate(d,"x",graph);
            })
            .attr("y2",function(d){
              return modifyLineCoordinate(d,"y",graph);
            });

        node.attr("transform",function(d){
          return "translate(" + d.x + "," + d.y + ")";
        });
      }

      function zoomed() {
        container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }

      function dragstarted(d) {
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed("dragging", true);
      }

      function dragged(d) {
        d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
      }

      function dragended(d) {
        d3.select(this).classed("dragging", false);
      }

      function viewModal(name){
        var modal = d3.select("#modal");
        modal.style("top","10%")
              .style("left","30%")
              .style("height","80%")
              .style("width","40%")
              .style("display","block")
              .transition()
              .duration(100)
              .style("opacity",1.0);

        modal.select("#content").select("#top").html(ContentBox(name));
        modal.select("#content").select("#topmedia").html(fanList(name));
        d3.select("#changeIDBtn")
          .on("click",function(){
            searchFan(name);
          });
      }

      function ContentBox(name){
        var content = "";

        content += '<div class="media">';
        content +=  ' <div class="media-left">';
        content += '   <img src=" '+ users[name].iconURL +' " height = "100%">'
        content += ' </div>';
        content +=  '<div class="media-body">';
        content +=  '  <div class="col-md-3 text-right">userName:</div><div class="col-md-9">' + name +'</div>';
        var blogTitle = users[name].blogTitle;
        var bookmarkAverage = users[name].bookmarkAverage;
        content +=  '  <div class="col-md-3 text-right">Blog:</div><div class="col-md-9"><a href="'+users[name].blogURL+'">'+ blogTitle +'</a></div>';
        content += '<div class="col-md-3 text-right">Popularity:</div><div class="col-md-9">'+bookmarkAverage+'</div>';
        content += '<div class="col-md-12" id="topmedia"></div>';
        content +=  '</div>';
        content += '</div>';
        content += '</div>';

        return content;
      }

      function fanList(name){
        var fans = [];
        links.forEach(function(d){
          if(d.target.name == name){
            fans.push(d.source.name);
          }
        });
        var list="";
        if(fans.length != 0){
          fans.forEach(function(name){
            list += '<div class="media">';
            list +=  ' <div class="media-left">';
            list += '   <img src=" '+ users[name].iconURL +' " height = "100%">'
            list += ' </div>';
            list +=  '<div class="media-body">';
            list +=  '  <div class="col-md-3 text-right">userName:</div><div class="col-md-9">' + name +'</div>';
            if(users[name].blogTitle == null){
              var blogTitle = "No Blog";
              var bookmarkAverage = 0;
              list +=  '  <div class="col-md-3 text-right">Blog:</div><div class="col-md-9">'+ blogTitle +'</div>';
            }else{
              var blogTitle = users[name].blogTitle;
              var bookmarkAverage = users[name].bookmarkAverage;
              list +=  '  <div class="col-md-3 text-right">Blog:</div><div class="col-md-9"><a href="'+users[name].blogURL+'">'+ blogTitle +'</a></div>';
            }

            list += '<div class="col-md-3 text-right">Popularity:</div><div class="col-md-9">'+bookmarkAverage+'</div>';
            list +=  '</div>';
            list += '</div>';
            list += '</div>';
          });
        }else{
          list += '<div class="col-md-12 text-center btn btn-sm" id="changeIDBtn" style="font-size:18px; margin:10px 0px; background-color:rgb(204, 204, 204);">';
          list += '<span class="glyphicon glyphicon-chevron-down">Search Fan</span>';
          list += '</div>';
        }

        return list;
      }

      function getLength(x1,y1,x2,y2){
        return Math.sqrt(Math.pow((x1-x2),2) + Math.pow((y1-y2),2));
      }

      function modifyLineCoordinate(data,axis,graph){
        var lineLength = getLength(data.source.x,data.source.y,data.target.x,data.target.y);
        var nodeBuf = graph.nodes().filter(function(buf){
          return buf.name == data.target.name;
        })[0];
        var radiusBuf;
        if(users[nodeBuf.name].bookmarkAverage > 0){
          radiusBuf = WeightToRadius * users[nodeBuf.name].bookmarkAverage;
        }else{
          radiusBuf = WeightToRadius;
        }
        radiusBuf = Math.sqrt(radiusBuf);
        var lineRadRatio = 1 - radiusBuf/lineLength;
        return data.source[axis] + (data.target[axis] - data.source[axis]) * lineRadRatio;
      }

      function searchButton(){
        var id = document.getElementById("userID").value;
        if(users[id] != undefined){
          var g = d3.select("#g_"+id).selectAll("circle")
          g.transition()
           .duration(1500)
           .style("fill","rgb(244, 252, 174)")
           .transition()
           .duration(1500)
           .style("fill","url('#image_" + id + "')");
        }
      };

  });
};
function searchFan(userID){
  ids.push(userID);
  main();
}
