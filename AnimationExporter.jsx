#target photoshop

//Get original document's path and name, to save exported files at that location
var parentFolderPath = app.activeDocument.path;
var docName = app.activeDocument.name;
docName = docName.substring(0, docName.length-4); //Exported folder shouldn't have .psd in name

//Duplicate document, to prevent any changes to original document
var doc = app.activeDocument.duplicate();

//Make sure to measure in pixels
preferences.rulerUnits = Units.PIXELS;

//Every layer set is it's own animation
for(i = 0; i < doc.layerSets.length; ++i)
{ 
    var layerSet = doc.layerSets[i];
  
    //Skip layer set if it is disabled (no need to export animations that aren't desired)
    if(!layerSet.visible)
        continue;
  
    //Calculate size of new document (should fit all layers from set)
    var height = layerSet.bounds[3].value - layerSet.bounds[1].value;
    var width = layerSet.bounds[2].value - layerSet.bounds[0].value;
    
    //Get offet of this layer set from centre of original document (used to calculate placement in new document)
    var setOffsetX = (layerSet.bounds[0] + layerSet.bounds[2])/2;
    var setOffsetY = (layerSet.bounds[1] + layerSet.bounds[3])/2;
    
    var newDoc = app.documents.add (width, height, doc.resolution, layerSet.name, NewDocumentMode.RGB, DocumentFill.TRANSPARENT, doc.pixelAspectRatio, doc.bitsPerChannel, doc.colorProfileName);
    
    var newDocName = newDoc.name;    
    
    //Create folder to store this animation's frames
    var subfolder = new Folder(parentFolderPath + "/" + docName + "/" + newDocName + "/");
    subfolder.create();

    for(j = layerSet.artLayers.length - 1; j >= 0 ; --j)
    {
        var layer = layerSet.artLayers[j];

        app.activeDocument = doc;        
        
        var offsetX = ((layer.bounds[0] + layer.bounds[2])/2)-setOffsetX;
        var offsetY = ((layer.bounds[1] + layer.bounds[3])/2)-setOffsetY;

        var visible = layer.visible;
        layer.visible = true;
        layer.copy();
        layer.visible = visible;

        app.activeDocument = newDoc;
         
        var newLayer = newDoc.paste();
        newLayer.name = layer.name;
        newLayer.translate (offsetX, offsetY);
    }

    //Make sure new doc is active (since pivot might skip this)
    app.activeDocument = newDoc;

    //Disable all layers (only enable the one we are currently saving below)
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
        
        ++num; //Keep track of frame count, for file naming
        
        layer.visible = true;
        
        var documentPath = subfolder + "/" + newDocName + "_" + num + ".png";
        
        $.write ("(" + documentPath + ")");
        
        var file = new File(documentPath);
        
        var options = new PNGSaveOptions();
        
        newDoc.saveAs(file, options, true);
        
        layer.visible = false;
    }
    
    newDoc.close(SaveOptions.DONOTSAVECHANGES);
}

doc.close(SaveOptions.DONOTSAVECHANGES);