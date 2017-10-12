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
    
    for(j = layerSet.artLayers.length - 1; j >= 0 ; --j)
    {
         app.activeDocument = doc;        
        
         var layer = layerSet.artLayers[j];
         var visible = layer.visible;
         layer.visible = true;
         layer.copy();
         layer.visible = visible;
         
         var offsetX = ((layer.bounds[0] + layer.bounds[2])/2)-setOffsetX;
         var offsetY = ((layer.bounds[1] + layer.bounds[3])/2)-setOffsetY;
         
         app.activeDocument = newDoc;
         
         var newLayer = newDoc.paste();
         
         newLayer.translate (offsetX, offsetY);
    }

    //Disable all layers
    for(j= 0; j < newDoc.artLayers.length; ++j)
    {
        newDoc.artLayers[j].visible = false;
    }

    //Save individual layers to file
    for(j= 0; j < newDoc.artLayers.length; ++j)
    {
        var layer = newDoc.artLayers[j];
        
        layer.visible = true;
        
        var documentPath = subfolder + "/" + newDocName + "_" + (j+1) + ".png";
        
        $.write ("(" + documentPath + ")");
        
        var file = new File(documentPath);
        
        var options = new PNGSaveOptions();
        
        newDoc.saveAs(file, options, true);
        
        layer.visible = false;
    }
    
    //Save document information as JSON
    var json = '{\n' +
                    '\t"name":"' + newDocName + '",\n' + 
                     '\t"width":' + newDoc.width.value + ',\n' +
                     '\t"height":' + newDoc.height.value+ ',\n' +
                     '\t"pivot":{\n\t\t"x":0.5,"y":0\n\t}\n}';
    
    var file = new File(subfolder + "/info.json");
    file.open('w');
    file.write(json);
    file.close();
    
    newDoc.close(SaveOptions.DONOTSAVECHANGES);
}

doc.close(SaveOptions.DONOTSAVECHANGES);