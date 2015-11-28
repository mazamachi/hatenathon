var width = window.innerWidth * 0.8;
var height = window.innerHeight * 0.8;
const WeightToRadius = 6;
const gojoTreshHold = 0.6;

function main(){
  d3.json("./example4.json",function(err,data){
    if(err){
      console.log("err,hage!!");
    }else{
      // console.log(data);
      var links = data[0].links;
      var users = data[0].users;
      var nodes = {};
      links.forEach(function(link){
        // console.log(link);
        if(!(link.source in nodes)){
          nodes[link.source] = {name:link.source};
          link.source = nodes[link.source];
        }else{
          link.source = nodes[link.source];
        }
        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target})
      });
      // console.log(nodes);
    }

    var svg = d3.select(".dataView")
                .append("svg")
                .attr("width",width)
                .attr("height",height);

    var defs = svg.append("defs");

    defs.selectAll("marker")
       .data(["head"])
       .enter()
       .append("marker")
       .attr("id",function(d){
         // console.log(d);
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

     var graph = d3.layout.force()
                          .nodes(d3.values(nodes))
                          .links(links)
                          .size([width,height])
                          .linkDistance(100)
                          .charge(-500)
                          .on("tick",tick)
                          .start();

     var link = svg.selectAll(".link")
                   .data(graph.links())
                   .enter()
                   .append("line")
                   .attr("fill", "none")
                   .attr("stroke", function(d){
                    if(d.bookmarkRate > gojoTreshHold){
                      return "blue";
                    }else{
                      return "red";
                    }
                    return "black";
                   })
                   .attr("stroke-width","2px")
                   .attr("marker-end","url(#head)");

     // console.log(graph.links());

     var node = svg.selectAll(".node")
                   .data(graph.nodes())
                   .enter()
                   .append("g")
                   .attr("fill","#CCCCCC")
                   .on("click",function(d){
                     viewModal(d);
                   })
                   .call(graph.drag);

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
         .attr("fill","gray");


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

      function viewModal(d){
        // console.log(d);
        // var characterName = d;
        var modal = d3.select("#modal");
        modal.style("top","10%")
              .style("left","30%")
              .style("height","80%")
              .style("width","40%")
              .style("display","block")
              .transition()
              .duration(100)
              .style("opacity",1.0);

        modal.select("#content").select("#top").html(ContentBox(d.name));
        modal.select("#content").select("#topmedia").html(fanList(d.name));
        d3.select("#changeIDBtn")
          .on("click",function(){
            searchFan(d.name);
          });
      }

      function ContentBox(name){
        console.log(users[name]);

        var content = "";

        content += '<div class="media">'
        content +=  ' <div class="media-left">'
        content += '   <img src=" '+ users[name].iconURL +' " height = "100%">'
        content += ' </div>'
        content +=  '<div class="media-body">'
        content +=  '  <div class="col-md-12">userName:' + name +'</div>'
        content +=  '  <div class="col-md-12">Blog:<a href="'+users[name].blogURL+'">'+ users[name].blogTitle +'</a></div>'
        content += '<div class="col-md-12">bookmarkAverage:'+users[name].bookmarkAverage+'</div>'
        content += '<div class="col-md-12" id="topmedia"></div>'
        content +=  '</div>'
        content += '</div>'
        content += '</div>';

        return content;
      }

      function fanList(name){
        var fans = [];
        links.forEach(function(d){
          // console.log(d);
          if(d.target.name == name){
            // console.log(d.source);
            fans.push(d.source.name);
          }
        });
        console.log(fans);
        var list="";
        if(fans.length != 0){
          fans.forEach(function(name){
            list += '<div class="media">'
            list +=  ' <div class="media-left">'
            list += '   <img src=" '+ users[name].iconURL +' " height = "100%">'
            list += ' </div>'
            list +=  '<div class="media-body">'
            list +=  '  <div class="col-md-12">userName:' + name +'</div>'
            list +=  '  <div class="col-md-12">Blog:<a href="'+users[name].blogURL+'">'+ users[name].blogTitle +'</a></div>'
            list += '<div class="col-md-12">bookmarkAverage:'+users[name].bookmarkAverage+'</div>'
            list +=  '</div>'
            list += '</div>'
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
        // console.log(data);
        var lineLength = getLength(data.source.x,data.source.y,data.target.x,data.target.y);
        var nodeBuf = graph.nodes().filter(function(buf){
          // console.log("buf",buf.name);
          // console.log("d",d.target.name);
          return buf.name == data.target.name;
        })[0];
        var radiusBuf;
        // console.log(buf.name);
        if(users[nodeBuf.name].bookmarkAverage > 0){
          radiusBuf = WeightToRadius * users[nodeBuf.name].bookmarkAverage;
        }else{
          radiusBuf = WeightToRadius;
        }
        radiusBuf = Math.sqrt(radiusBuf);
        // console.log("node_buf",node_buf);
        // console.log("line:",lineLength);
        // console.log("radius:",node_buf.weight*WeightToRadius);
        var lineRadRatio = 1 - radiusBuf/lineLength;
        return data.source[axis] + (data.target[axis] - data.source[axis]) * lineRadRatio;
      }

      function searchFan(userID){
        console.log(userID);
      }
  });
};
