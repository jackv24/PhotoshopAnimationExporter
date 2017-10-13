#target photoshop

function mkdir(path) {  
  var folder = new Folder(path);  
     
  if (!folder.exists) {  
    var parts = path.split('/');  
    parts.pop();  
    mkdir(parts.join('/'));  
    folder.create();  
  }  
}  

var parentFolderPath = app.activeDocument.path;
var docName = app.activeDocument.name;
docName = docName.substring(0, docName.length-4);

var doc = app.activeDocument.duplicate();

preferences.rulerUnits = Units.PIXELS;

for(i = 0; i < doc.layerSets.length; ++i)
{ 
    var layerSet = doc.layerSets[i];
  
    if(!layerSet.visible)
        continue;
  
    var height = layerSet.bounds[3].value - layerSet.bounds[1].value;
    var width = layerSet.bounds[2].value - layerSet.bounds[0].value;
    
    var setOffsetX = (layerSet.bounds[0] + layerSet.bounds[2])/2;
    var setOffsetY = (layerSet.bounds[1] + layerSet.bounds[3])/2;
    
    var newDoc = app.documents.add (width, height, doc.resolution, layerSet.name, NewDocumentMode.RGB, DocumentFill.TRANSPARENT, doc.pixelAspectRatio, doc.bitsPerChannel, doc.colorProfileName);
    
    var newDocName = newDoc.name;    
    
    var subfolder = new Folder(parentFolderPath + "/" + newDocName + "/");
    subfolder.create();       
    
    var pivot = {"x":0.5, "y": 0};
    
    for(j = layerSet.artLayers.length - 1; j >= 0 ; --j)
    {
         var layer = layerSet.artLayers[j];
        
         app.activeDocument = doc;        
        
         var visible = layer.visible;
         layer.visible = true;
         layer.copy();
         layer.visible = visible;
         
         var offsetX = ((layer.bounds[0] + layer.bounds[2])/2)-setOffsetX;
         var offsetY = ((layer.bounds[1] + layer.bounds[3])/2)-setOffsetY;
         
         app.activeDocument = newDoc;
         
         var newLayer = newDoc.paste();
         newLayer.name = layer.name;
         newLayer.translate (offsetX, offsetY);
    }

    //Disable all layers
    for(j= 0; j < newDoc.artLayers.length; ++j)
    {
        newDoc.artLayers[j].visible = false;
    }

    //Save individual layers to file
    var num = 0;
    for(j= 0; j < newDoc.artLayers.length; ++j)
    {
        var layer = newDoc.artLayers[j];
        
        $.write(layer.name);
        
        //If this layer s titled pivot, don't use it as a sprite, use it to set pivot position
         if(layer.name == "pivot")
        {
             var posX = ((layer.bounds[0].value + layer.bounds[2].value)/2);
             var posY = ((layer.bounds[1].value + layer.bounds[3].value)/2);
             
             pivot.x = posX / width;
             pivot.y = 1-(posY / height);
             
             continue;
        }
        
        ++num;
        
        layer.visible = true;
        
        var documentPath = subfolder + "/" + newDocName + "_" + num + ".png";
        
        $.write ("(" + documentPath + ")");
        
        var file = new File(documentPath);
        
        var options = new PNGSaveOptions();
        
        newDoc.saveAs(file, options, true);
        
        layer.visible = false;
    }
    
    //Save document information as JSON
    var json = '{\n' +
                    '\t"packingTag":"' + docName + '",\n' + 
                     '\t"pivot":{\n\t\t"x":' + pivot.x + ',"y":' + pivot.y + '\n\t}\n}';
    
    //{"packingTag":"","pivot":{"x":0.0,"y":0.0}}
    
    var file = new File(subfolder + "/info.json");
    file.open('w');
    file.write(json);
    file.close();
    
    newDoc.close(SaveOptions.DONOTSAVECHANGES);
}

doc.close(SaveOptions.DONOTSAVECHANGES);