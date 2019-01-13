var height = 600;
var width = 800;

////////////////////////颜色转换////////////////////////////////////////////////////

// 颜色转化1 慢
var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
/*RGB颜色转换为16进制*/
String.prototype.colorHex = function(){
     var that = this;
     if(/^(rgb|RGB)/.test(that)){
          var aColor = that.replace(/(?:\(|\)|rgb|RGB)*/g,"").split(",");
          var strHex = "#";
          for(var i=0; i<aColor.length; i++){
               var hex = Number(aColor[i]).toString(16);
               if(hex === "0"){
                    hex += hex;    
               }
               strHex += hex;
          }
          if(strHex.length !== 7){
               strHex = that;    
          }
          return strHex;
     }else if(reg.test(that)){
          var aNum = that.replace(/#/,"").split("");
          if(aNum.length === 6){
               return that;    
          }else if(aNum.length === 3){
               var numHex = "#";
               for(var i=0; i<aNum.length; i+=1){
                    numHex += (aNum[i]+aNum[i]);
               }
               return numHex;
          }
     }else{
          return that;    
     }
};
// 颜色转化2 快一点
function cc(r) {
	res = Math.round(r).toString(16);
	if (res.length == 1)
	{
		return "0"+res;
	}
	else
	{
		return res;
	}
}

// 颜色转化3 快
var color_array = [];
for (var i = 0; i <= 255; i++) {
	res = i.toString(16);
	if (res.length == 1)
	{
		color_array.push("0"+res);
	}
	else
	{
		color_array.push(res);
	}
}

///////////////////////////////辅助函数/////////////////////////////////////////////

// js对象深拷贝
var objDeepCopy = function (source) {
    var sourceCopy = source instanceof Array ? [] : {};
    for (var item in source) {
        sourceCopy[item] = typeof source[item] === 'object' ? objDeepCopy(source[item]) : source[item];
    }
    return sourceCopy;
}


function edgeSortCmp(a, b)
{
	if (Math.round(a.x) < Math.round(b.x))return -1;

	if (Math.round(a.x) == Math.round(b.x))
	{
		if (Math.round(a.z) < Math.round(b.z))
		{
			return -1;
		}
		else {
			return 1;
		}
	}
	else return 1;
}

EPS = 1e-6;

function isEqualf(a, b) {
	if (Math.abs(a - b) < EPS)
	{
		return true;
	}
	return false;
};

function remove(list, target)
{
	if (list.indexOf(target)==-1) {
		return list;
	}
	else{
		list.splice(list.indexOf(target),1);
		return list;
	}
};



//////////////////////////////主要数据结构//////////////////////////////////////////////


function Vertex(x,y,z)
{
	this.x = x;
	this.y = y;
	this.z = z;
}

function Face()
{
	this.vertexIdx = [];
	this.normalIdx = [];
	this.color = new Vertex(0,0,0);
}


function Edge(x=0,dx=0,dy=0,pid=0)
{
	this.x = x;
	this.dx = dx;
	this.dy = dy;
	this.pid = pid;
}

//活化边
function ActiveEdge(x=0,dx=0,dy=0,z=0,dzx=0,dzy=0,pid=0)
{
	this.x = x;
	this.dx = dx;
	this.dy = dy;
	this.z = z;
	this.dzx = dzx;
	this.dzy = dzy;
	this.pid = pid;
}

function Polygon(a=0,b=0,c=0,d=0,dy=0,inflag=0,pid=0)
{
	this.a = a;
	this.b = b;
	this.c = c; 
	this.d = d;
	this.dy = dy;
	this.inflag = inflag;
	this.pid = pid;
}

// 主要全局变量
var Vertexes = [];
var Faces = [];
var Normals = [];
var	center_point = new Vertex(width / 2, height / 2, 0);
var pidBuffer = [];
var RotateMat = [];

var polygonIDTable = [];
var edgeTable = []; 

var ActiveEdgeTable = [];
var inPolygonList = [];
var canvas_flag = 0;



// 类似操作符重载的辅助函数
function Vsub(a, b)
{
	res = new Vertex(a.x - b.x, a.y - b.y, a.z - b.z);
	return res;
}

function Vadd(a, b)
{
	res = new Vertex(a.x + b.x, a.y + b.y, a.z + b.z);
	return res;
}

function Vmul(a, num)
{
	res = new Vertex(a.x * num, a.y * num, a.z * num);
	return res;
}

function Vdiv(a, num)
{
	res = new Vertex(a.x / num, a.y / num, a.z / num);
	return res;
}

function cross(u, v)
{
	res = new Vertex(u.y * v.z - u.z * v.y, u.z * v.x - u.x * v.z, u.x * v.y - u.y * v.x);
	return res;
}

function normalize(u)
{
	return Vmul(u, (1.0 / Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z)) );
};

function dot(u, v)
{
	return u.x * v.x + u.y * v.y + u.z * v.z;
}

// clear相关函数
function init_pidBuffer_and_RotateMat()
{
	pidBuffer = [];
	for (var i = 0; i < height; i++) {
		tmp_array = [];
		for (var j = 0; j < width; j++) {
			tmp_array.push(-1);
		}
		pidBuffer.push(tmp_array);
	}

	RotateMat = [];
	for (var i = 0; i < 3; i++) {
		tmp_array = [];
		for (var j = 0; j < 3; j++) {
			tmp_array.push(0);
		}
		RotateMat.push(tmp_array);
	}
}

function clear_var()
{
	Vertexes = [];
	Faces = [];
	Normals = [];
	polygonIDTable = [];
	edgeTable = []; 
	ActiveEdgeTable = [];
	inPolygonList = [];
}

