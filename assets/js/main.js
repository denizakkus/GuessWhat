var mouseIsPressed=false;
var coordinates=[];
var classNames = [];
var canvas;
var model;

//TODO->REFACTOR START
function getMinBox() {
    //get coordinates 
    var coorX = coordinates.map(function(p) {
        return p.x
    });
    var coorY = coordinates.map(function(p) {
        return p.y
    });

    //find top left and bottom right corners 
    var min_coords = {
        x: Math.min.apply(null, coorX),
        y: Math.min.apply(null, coorY)
    }
    var max_coords = {
        x: Math.max.apply(null, coorX),
        y: Math.max.apply(null, coorY)
    }

    //return as strucut 
    return {
        min: min_coords,
        max: max_coords
    }
}

function findIndicesOfMax(inp, count) {
    var outp = [];
    for (var i = 0; i < inp.length; i++) {
        outp.push(i); // add index to output array

        if (outp.length > count) {
            outp.sort(function(a, b) {
                return inp[b] - inp[a];
            }); // descending sort the output array
            outp.pop(); // remove the last index (index of smallest element in output array)
        }
    }
    for (var i=0;i<outp.length;i++){
        console.log("OUTPUT: "+outp[i]);
    }
    console.log("inp length: "+inp.length);
    return outp;
}

/*
find the top 5 predictions
*/
function findTopValues(inp, count) {
    var outp = [];
    let indices = findIndicesOfMax(inp, count)
    // show 5 greatest scores
    for (var i = 0; i < indices.length; i++)
        outp[i] = inp[indices[i]]
    return outp
}

/*
preprocess the data
*/
function preprocess(imgData) {
    return tf.tidy(() => {
        //convert to a tensor 
        let tensor = tf.browser.fromPixels(imgData, numChannels = 1)
        
        //resize 
        const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat()
        
        //normalize 
        const offset = tf.scalar(255.0);
        const normalized = tf.scalar(1.0).sub(resized.div(offset));

        //We add a dimension to get a batch shape 
        const batched = normalized.expandDims(0)
        return batched
    })
}

/*
get the current image data 
*/
function getImageData() {
        //get the minimum bounding box around the drawing 
        const mbb = getMinBox()

        //get image data according to dpi 
        const dpi = window.devicePixelRatio
        const imgData = canvas.contextContainer.getImageData(mbb.min.x * dpi, mbb.min.y * dpi,
                                                      (mbb.max.x - mbb.min.x) * dpi, (mbb.max.y - mbb.min.y) * dpi);
        console.log(mbb.min.x)
        return imgData
    }

/*
get the prediction 
*/
function getFrame() {
    //make sure we have at least two recorded coordinates 
    if (coordinates.length >= 2) {
       
        //get the image data from the canvas 
        const imgData = getImageData()

        //get the prediction 
        const pred = model.predict(preprocess(imgData)).dataSync()

        //find the top 5 predictions 
        const indices = findIndicesOfMax(pred, 5)
        const probs = findTopValues(pred, 5)
        const names = getClassNames(indices)
       
        //set the table 
        setTable(names, probs)
    }

}

function getClassNames(indices) {
    var outp = []
    for (var i = 0; i < indices.length; i++)
    {
        outp[i] = window.classNames[indices[i]]
    }
    return outp
}

/*
set the table of the predictions 
*/
function setTable(top5, probs) {
    //loop over the predictions 
    for (var i = 0; i < top5.length; i++) {
        let sym = document.getElementById('sym' + (i + 1))
        let prob = document.getElementById('prob' + (i + 1))
        sym.innerHTML = top5[i]
        prob.innerHTML = Math.round(probs[i] * 100)
    }
    //create the pie 

}
//TODO->REFACTOR END

//Updates our coordinates list
function UpdateCoordinates(event)
{
    var pointer = canvas.getPointer(event.e); //Returns the mouse
    var positionX = pointer.x;
    var positionY = pointer.y;

    if (mouseIsPressed && positionX >= 0 && positionY >= 0) 
	{
        coordinates.push(pointer)
    }
}



//Sets up all listeners for the canvas
$(function()
{
    if(typeof canvas == 'undefined')
        InitializeCanvas()

    if(window.classNames.length==0)
        LoadClassFile();
    
	canvas.on('mouse:move',function(e){UpdateCoordinates(e);});
	canvas.on('mouse:down',function(e){mouseIsPressed=true;console.log("MOUSE DOWN");});
	canvas.on('mouse:up',function(e){getFrame();mouseIsPressed=false; console.log("MOUSE UP");});
})

//Initializes the canvas variable
function InitializeCanvas()
{
    canvas = window._canvas = new fabric.Canvas('canvas');
	canvas.isDrawingMode = 0;
	canvas.freeDrawingBrush.color="black";
	canvas.freeDrawingBrush.width=10;
	canvas.backgroundColor='#ffffff';;
	
	
	canvas.renderAll();
    $('button').prop('disabled', false);//Enable the clear button
	//InitializeCanvasListeners();
}

function erase() 
{
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    coordinates = [];
}

async function LoadClassFile() 
{
	path = '/model2/class_names.txt'
    await $.ajax({
        
        url: path,
        dataType: 'text',
    }).done(SetupClassNames);
}

function SetupClassNames(data) 
{
    const names = data.split(/\n/)
    for (var i = 0; i < names.length - 1; i++) 
	{	
        let name = names[i];
        window.classNames[i] = name;
        console.log("Setup class names: "+ window.classNames[i]+ window.classNames.length);
    }
}

//The initialization function
async function start(mode)
{
	//Initialize the canvas
    
    //InitializeCanvas();
    
    //Setup the class names
	await LoadClassFile();
	//Load the model
	model = await(tf.loadLayersModel('/model2/model.json'))
	//Set the drawing mode of the canvas to true
	canvas.isDrawingMode = 1;
	document.getElementById('status').innerHTML = 'Model Loaded';
}