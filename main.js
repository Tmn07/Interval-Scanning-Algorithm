function model_display(file_string)
{
    console.time('Total');
    load_obj(file_string);
    ScanLineON();
    ComputeColor();
    Render();
    console.timeEnd('Total');
}

function model_rotate(RotateMat)
{
    console.time('Total');
    // 矩阵乘法旋转face，vertex等变量
    var_rotate(RotateMat);
    // model旋转后重新计算与渲染
    ScanLineON(resize_flag=0);
    Render();
    console.timeEnd('Total');
}

/////////////////////////////////////////////////////////////////////////////////////

function load_obj(objmodel_string) {
    console.time("Load_obj");
    clear_var();
    lines_array = objmodel_string.split("\n");
    for (var i = 0; i < lines_array.length; i++) {
        nowline_array = lines_array[i];
        if (nowline_array.slice(0,2) == "v ") {
            tmp_array = nowline_array.trim().split(/\s+/);
            Vertexes.push(new Vertex(parseFloat(tmp_array[1]), 
                    parseFloat(tmp_array[2]), 
                    parseFloat(tmp_array[3])));
        }
        else if(nowline_array[0] == "f")
        {
            face = new Face();
            tmp_array = nowline_array.trim().split(/\s+/);
            // console.log(tmp_array);
            for (var fidx = 1; fidx < tmp_array.length; fidx++) {
                if (tmp_array[2].indexOf("/")==-1) {
                    // 不含/表示
                    face.vertexIdx.push(tmp_array[fidx]-1);
                }
                else{
                    v_vt_vn = tmp_array[fidx].split("/");
                    // console.log();
                    face.vertexIdx.push(v_vt_vn[0]-1);
                    face.normalIdx.push(v_vt_vn[2]-1);
                }
            }
            if (face.vertexIdx.length > 2)
            {
                a = Vertexes[face.vertexIdx[0]];
                b = Vertexes[face.vertexIdx[1]];
                c = Vertexes[face.vertexIdx[2]];
                normal = normalize(cross(Vsub(b,a), Vsub(c,b)));
                face.normal = normal;
            }
            Faces.push(face);
        }
        else if(nowline_array.slice(0,2) == "vn")
        {
            tmp_array = nowline_array.trim().split(/\s+/);
            Normals.push(new Vertex(parseFloat(tmp_array[1]), 
                    parseFloat(tmp_array[2]), 
                    parseFloat(tmp_array[3])));
        }
    }
    console.log("顶点数量：" + Vertexes.length);
    console.log("面片数量："+Faces.length);
    console.timeEnd("Load_obj");
}

function compute_RotateMat(theta, n1, n2, n3)
{
    cosine = Math.cos(theta);
    sine = Math.sin(theta);

    RotateMat[0][0] = n1*n1 + (1 - n1*n1)*cosine;
    RotateMat[0][1] = n1*n2*(1 - cosine) + n3*sine;
    RotateMat[0][2] = n1*n3*(1 - cosine) - n2*sine;

    RotateMat[1][0] = n1*n2*(1 - cosine) - n3*sine;
    RotateMat[1][1] = n2*n2*(1 - cosine) + cosine;
    RotateMat[1][2] = n2*n3*(1 - cosine) + n1*sine;

    RotateMat[2][0] = n1*n2*(1 - cosine) + n2*sine;
    RotateMat[2][1] = n2*n3*(1 - cosine) - n1*sine;
    RotateMat[2][2] = n3*n3 + (1 - n3*n3)*cosine;
}

function var_rotate(RotateMat)
{
    vertex_num = Vertexes.length;
    for (var i = 0; i < vertex_num; i++) {
        tmp_point = objDeepCopy(Vsub(Vertexes[i], center_point));
        Vertexes[i].x = RotateMat[0][0] * tmp_point.x + RotateMat[0][1] * tmp_point.y + RotateMat[0][2] * tmp_point.z;
        Vertexes[i].y = RotateMat[1][0] * tmp_point.x + RotateMat[1][1] * tmp_point.y + RotateMat[1][2] * tmp_point.z;
        Vertexes[i].z = RotateMat[2][0] * tmp_point.x + RotateMat[2][1] * tmp_point.y + RotateMat[2][2] * tmp_point.z;
        Vertexes[i] = Vadd(Vertexes[i], center_point);
    }
        // 顶点法向量
    normal_num = Normals.length;
    for (var i = 0; i < normal_num; ++i)
    {
        tmp_point = objDeepCopy(Normals[i]);
        Normals[i].x = RotateMat[0][0] * tmp_point.x + RotateMat[0][1] * tmp_point.y + RotateMat[0][2] * tmp_point.z;
        Normals[i].y = RotateMat[1][0] * tmp_point.x + RotateMat[1][1] * tmp_point.y + RotateMat[1][2] * tmp_point.z;
        Normals[i].z = RotateMat[2][0] * tmp_point.x + RotateMat[2][1] * tmp_point.y + RotateMat[2][2] * tmp_point.z;
    }
    // 面的法向量
    face_num = Faces.length;
    for (var i = 0; i < face_num; ++i)
    {
        tmp_point = objDeepCopy(Faces[i].normal);
        Faces[i].normal.x = RotateMat[0][0] * tmp_point.x + RotateMat[0][1] * tmp_point.y + RotateMat[0][2] * tmp_point.z;
        Faces[i].normal.y = RotateMat[1][0] * tmp_point.x + RotateMat[1][1] * tmp_point.y + RotateMat[1][2] * tmp_point.z;
        Faces[i].normal.z = RotateMat[2][0] * tmp_point.x + RotateMat[2][1] * tmp_point.y + RotateMat[2][2] * tmp_point.z;
    }
}

function model_resize()
{
    min_xyz = new Vertex(0xfffffff, 0xfffffff, 0xfffffff);
    max_xyz = new Vertex(-0xfffffff, -0xfffffff, -0xfffffff);
    vertex_num = Vertexes.length
    for (var i = 0; i < vertex_num; ++i)
    {
        tmpvertex = Vertexes[i];
        min_xyz.x = Math.min(min_xyz.x, tmpvertex.x);
        min_xyz.y = Math.min(min_xyz.y, tmpvertex.y);
        min_xyz.z = Math.min(min_xyz.z, tmpvertex.z);
        max_xyz.x = Math.max(max_xyz.x, tmpvertex.x);
        max_xyz.y = Math.max(max_xyz.y, tmpvertex.y);
        max_xyz.z = Math.max(max_xyz.z, tmpvertex.z);
    }
    center_xyz = Vdiv(Vadd(min_xyz, max_xyz), 2);
    model_width = max_xyz.x - min_xyz.x;
    model_height = max_xyz.y - min_xyz.y;
    max_model_len = Math.max(model_width, model_height);
    scale = Math.min(width, height) / max_model_len;
    scale = 0.6*scale;

    for (var i = 0; i < vertex_num; ++i)
    {
        vertex_point = Vertexes[i];
        vertex_point.x = (vertex_point.x - center_xyz.x)*scale + width / 2;
        vertex_point.y = (vertex_point.y - center_xyz.y)*scale + height / 2;
        vertex_point.z = (vertex_point.z - center_xyz.z)*scale;
    }

}

function build_table(){
    polygonIDTable = [];
    for (var i = 0; i < height; i++) {
        edgeTable[i] = [];
    }
    faces_size = Faces.length;
    for (var i = 0; i < faces_size; ++i)
    {
        min_y = 0xfffffff;
        max_y = -0xfffffff;
        face = Faces[i];
        polygon = new Polygon();
        polygon.pid = i;
        //构建分类边表
        vertexIdx = face.vertexIdx;
        for (var j = 0, vsize = vertexIdx.length; j < vsize; ++j)
        {
            pt1 = Vertexes[vertexIdx[j]];
            pt2 = (j==vsize-1) ? Vertexes[vertexIdx[0]] : Vertexes[vertexIdx[j+1]];
            if (pt1.y < pt2.y) {
                // swap trick
                pt2 = [pt1, pt1 = pt2][0];
            }
            edge = new Edge();
            edge.dy = Math.round(pt1.y) - Math.round(pt2.y);
            if (Math.round(pt1.y) < 0) continue;
            if (edge.dy <= 0) continue;
            edge.x = pt1.x;
            edge.pid = polygon.pid;
            edge.dx = -(pt1.x - pt2.x) / (pt1.y - pt2.y);
            try {
                edgeTable[Math.round(pt1.y)].push(edge);
            } catch (error) {
                console.log("error");
            }
            min_y = Math.min(pt2.y, min_y);
            max_y = Math.max(pt1.y, max_y);
        }
        //构建分类多边形表
        polygon.dy = Math.round(max_y) - Math.round(min_y);
        v = Vertexes[face.vertexIdx[0]];
        polygon.a = face.normal.x;
        polygon.b = face.normal.y;
        polygon.c = face.normal.z;
        polygon.d = -(polygon.a*v.x + polygon.b*v.y + polygon.c*v.z);
        polygon.inflag = false;
        polygonIDTable.push(polygon);
    }
};

// 扫描当前y
function addEdge(y){
    line_egdeTable = edgeTable[y];
    if (line_egdeTable.length == 0)
        return;
    for (var i = 0; i < line_egdeTable.length; i++) {
        it = line_egdeTable[i];
        active_edge = new ActiveEdge();
        active_polygon = polygonIDTable[line_egdeTable[i].pid]
        active_edge.x = line_egdeTable[i].x;
        active_edge.dx = line_egdeTable[i].dx;
        active_edge.dy = line_egdeTable[i].dy;
        active_edge.pid = line_egdeTable[i].pid;
        if (isEqualf(active_polygon.c,0)) {
            active_edge.z = 0;
            active_edge.dzx = 0;
            active_edge.dzy = 0;
        }
        else{
            active_edge.z = -(active_polygon.d + 
                active_polygon.a*line_egdeTable[i].x + 
                active_polygon.b*y) / active_polygon.c;
            active_edge.dzx = -(active_polygon.a / active_polygon.c);
            active_edge.dzy = active_polygon.b / active_polygon.c;
        }
        ActiveEdgeTable.push(active_edge);
    }
};

function ScanLineON(resize_flag=1)
{
    console.time("Scanline");
    init_pidBuffer_and_RotateMat();
    // 仅在第一次加载模型时resize
    if (resize_flag) {
        model_resize();
    }
    build_table();
    ActiveEdgeTable = [];
    for (var y = height - 1; y >= 0; --y)
    {
        inPolygonList = [];
        addEdge(y);
        ActiveEdgeTable.sort(edgeSortCmp)
        // 遍历活化边表
        for (var ae = 0; ae < ActiveEdgeTable.length; ++ae)
        {
            edge1 = ActiveEdgeTable[ae];
            // 最后一个区间
            if (ae == ActiveEdgeTable.length - 1) {
                polygonIDTable[edge1.pid].inflag = false;
                remove(inPolygonList, edge1.pid);
                break;
            }
            edge2 = ActiveEdgeTable[ae + 1];

            // 扫描线刚进入该多边形
            if (!polygonIDTable[edge1.pid].inflag) {
                polygonIDTable[edge1.pid].inflag = true;
                inPolygonList.push(edge1.pid);
            }
            else {
                polygonIDTable[edge1.pid].inflag = false;
                remove(inPolygonList, edge1.pid);
            }
            if (Math.round(edge1.x) == Math.round(edge2.x)) {
                continue;
            }
            mid_x = Math.round((edge1.x + edge2.x) / 2);
            polygon_id = -1;
            Zvalue = -0xfffffff;
            temZvalue = 0;
            if (inPolygonList.length == 0) 
                continue;
            if (inPolygonList.length == 1) {
                polygon_id = inPolygonList[0];
            }
            else if(inPolygonList.length >= 2)
            {
                for (var i = 0; i < inPolygonList.length; i++) {
                    // inPolygonList[i]
                    active_polygon = polygonIDTable[inPolygonList[i]];
                    if (isEqualf(active_polygon.c, 0)) {
                        temZvalue = 0;
                    }
                    else {
                        temZvalue = -(active_polygon.d + active_polygon.a*(mid_x)+
                    active_polygon.b*y) / active_polygon.c;
                    }
                    if (Zvalue <= temZvalue) {
                        Zvalue = temZvalue;
                        polygon_id = active_polygon.pid;
                    }
                }
            }
            // 记录该点要保留的颜色
            if (polygon_id >= 0) {
                for (var x = Math.round(edge1.x), end = Math.round(edge2.x); x < end; ++x)
                {
                    pidBuffer[y][x] = polygon_id;
                }
                // console.log(y + " " + polygon_id);
            }
        }

        // 更新(包括移除)活化边表的值
        temActiveEdgeTable = [];
        for (var ae = 0; ae < ActiveEdgeTable.length; ++ae) {
            edge = ActiveEdgeTable[ae];
            --edge.dy;
            if (edge.dy <= 0) {
                continue;
            }
            edge.x += edge.dx;
            edge.z += edge.dzx*edge.dx + edge.dzy;
            temActiveEdgeTable.push(edge);
        }
        ActiveEdgeTable = temActiveEdgeTable;
        if (inPolygonList.length!=0) {
            console.log("inPolygonList error,check it");
        }
    }
    console.timeEnd("Scanline");
}

function ComputeColor()
{
    // 散射反照率
    kd = 1;
    // 光线颜色
    light_color = new Vertex(0.3, 0.3, 0.3);
    // 外界颜色
    ambient_color = new Vertex(0.3, 0.3, 0.3);
    // 光源
    light_position = new Vertex(400.0, 600.0, 500.0);
    face_num = Faces.length;
    // 遍历面
    for (var i = 0; i < face_num; i++) {
        face = Faces[i];
        face_vertex_num = face.vertexIdx.length;
        for (var j = 0; j < face_vertex_num; ++j)
        {
            face_vertex = Vertexes[face.vertexIdx[j]];
            ray_direction = normalize(Vsub(light_position, face_vertex));
            normal = face.normal;
            //求光线入射反方向与面法线/顶点法线的夹角cos
            cosine = Math.abs(dot(ray_direction, normal));
            if (cosine > 0.0)
            {
                face.color = Vadd(face.color, Vmul(light_color, kd*cosine));
            }
            face.color = Vadd(face.color, ambient_color);//增加环境颜色
        }
        face.color = Vdiv(face.color, face_vertex_num);
        //控制颜色取值范围在0.0～1.0之间
        if (face.color.x > 1.0)face.color.x = 1.0;
        if (face.color.x < 0.0)face.color.x = 0.0;
        if (face.color.y > 1.0)face.color.y = 1.0;
        if (face.color.y < 0.0)face.color.y = 0.0;
        if (face.color.z > 1.0)face.color.z = 1.0;
        if (face.color.z < 0.0)face.color.z = 0.0;
    }
}

function Render(){

    console.time("Render");
    var c=document.getElementById("myCanvas");
    var ctx=c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height); 
    for (var y = 0; y < height; ++y)
    {
        for (var x = 0; x < width; ++x)
        {
            tmp = pidBuffer[y][x];
            if (tmp >= 0)
            {
                rgb = Faces[tmp].color;
                // 从颜色映射表中取值，最快
                hec = "#"+color_array[Math.round(255*rgb.x)]+color_array[Math.round(255*rgb.y)]+color_array[Math.round(255*rgb.z)];
                // hec = "#"+cc(255*rgb.x)+cc(255*rgb.y)+cc(255*rgb.z);
                // tmp = "rgb("+Math.round(255*rgb.x)+","+Math.round(255*rgb.y)+","+Math.round(255*rgb.z)+")"
                // hec = tmp.colorHex();
                ctx.strokeStyle=hec;
                ctx.strokeRect(x,height-y,1,1);
            }
        }
    }
    console.timeEnd("Render");
    canvas_flag = 1;
}