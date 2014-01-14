window.app = window.app || {};

(function(ns){
    
    ns.math = {
        
        degreeToRadian : function(angle) {
            return ((angle*Math.PI) / 180);
        },

        radianToDegree : function(angle) {
            return ((angle*180) / Math.PI);
        },
        
        getDistance : function(x1, y1, x2, y2) {
            x2 = x2 - x1;
            y2 = y2 - y1;
            x1 = 0; // reset
            y1 = 0; // reset
            
            if (x2 < 0) x2 -= x2 * 2;
            if (y2 < 0) y2 -= y2 * 2;
            
            //console.info('x1:' + x1);
            //console.info('y1:' + y1);
            //console.info('x2:' + x2);
            //console.info('y2:' + y2);
            
            var opp = x2;
            var adj = y2;
            
            var hyp = Math.sqrt((opp * opp) + (adj * adj));
            
            //console.info(hyp);
            
            return hyp;
        },
        
        rotate : function(x, y, angle) {
            return {
                x : x * Math.cos(angle) + y * Math.sin(angle),
                y : -x * Math.sin(angle) + y * Math.cos(angle)
            };
        },
        
        radianBetweenPoints : function(x1, y1, x2, y2) {
            x2 = x2 - x1;
            y2 = y1 - y2; // reverse these, because we are calculating a /_
            x1 = 0; // reset
            y1 = 0; // reset
            
            var opp = x2;
            var adj = y2;
            
            var angle = Math.atan(opp / adj);
            
            // fix the angle to really represent a full circle
            if (x2 > x1 && y2 < y1) { // top-left
                angle = Math.PI / 2 + (Math.PI / 2 + angle);
            } else if (x2 < x1 && y2 > y1) { // bottom-right
                angle = (Math.PI * 2) + angle;
            } else if (x2 < x1 && y2 < y1) { // top-right
                angle = angle + (Math.PI / 2) * 2;
            } else if (x2 < x1 && y2 == y1) { // right
                angle = angle + (Math.PI * 2);
            } else if (x2 == x1 && y2 < y1) { // top
                angle = angle + Math.PI;
            }
            
            return angle;
        },
        
        getOpositeTriangleRadian : function(angle) {
            var circle = Math.PI * 2;
            var corner = Math.PI / 2;
            var opangle = circle - corner - (corner - angle);
            if (opangle > circle) opangle -= circle;
            return opangle;
        },
        
        // TODO: rotation support
        rectCollides : function(w1, h1, x1, y1, z1, r1, w2, h2, x2, y2, z2, r2) {
            
            if (z1 != z2) return false;
            
            var left1 = x1 - (w1 / 2);
            var right1 = left1 + w1;
            var top1 = y1 - (h1 / 2);
            var bottom1 = top1 + h1;

            var left2 = x2 - (w2 / 2);
            var right2 = left2 + w2;
            var top2 = y2 - (h2 / 2);
            var bottom2 = top2 + h2;

            /*console.info('w1: ' + w1);
            console.info('h1: ' + h1);
            console.info('x1: ' + x1);
            console.info('y1: ' + y1);

            console.info('w2: ' + w2);
            console.info('h2: ' + h2);
            console.info('x2: ' + x2);
            console.info('y2: ' + y2);
            
            console.info('left1: ' + left1);
            console.info('right1: ' + right1);
            console.info('top1: ' + top1);
            console.info('bottom1: ' + bottom1);
            
            console.info('left2: ' + left2);
            console.info('right2: ' + right2);
            console.info('top2: ' + top2);
            console.info('bottom2: ' + bottom2);*/
            
            
            //          ------ 1
            //              ------- 2

            //              ------- 1
            //          ------ 2
            
            if (right1 < left2) return false;
            if (left1 > right2) return false;

            if (bottom1 < top2) return false;
            if (top1 > bottom2) return false;
            
            return true;
        },
        
        getCircleEdge : function(radius, angle) {
            var hyp = radius;
            
            // we want to know the adj first
            var sin = Math.sin(angle);
            var adj = sin * hyp;
            
            var opp = Math.sqrt(hyp * hyp - adj * adj);
            
            // check in which part (90 degrees segment) the angle is
            var segment = Math.ceil(angle / (Math.PI / 2));
            if (segment == 1 || segment == 4) {
                opp -= opp * 2;
            }
            
            return {
                x : adj,
                y : opp
            };
        }
    };
    
})(window.app);