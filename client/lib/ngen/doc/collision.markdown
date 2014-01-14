First step:
Check bounding box. If collides, get actual rect for both entities colliding, and proceed

Second step, method 1:
Use collision map. Collision map is a bitmap of any size that describes:
* outline
* body
using the map two functions can be implemented:
walk outline(code) take each cood of the outline and execute some code
collidesWithMap(x, y), checks if the x/y collides with either the outline or the body

the data structure of a collision map should look like:
{
    width: 100,
    height: 200,
    outline : [{x,y}, {x,y}] // array of all positions containing outline data (for fast and easy walking?)
    map: [] // arr of all pixels
}

Thge bigger the map, the more accurate and slow it gets.

Second step, method 2:
Draw outline of screen or in separate context, getImageData and compare pixel data! But of course this is a mere variation on the last method.
However, this is more flexible, when for instance the shape changes!

Second step, method 3:
Have mathematical functions that simulate drawing the outline, and knowing where the body is.