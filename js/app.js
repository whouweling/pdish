var clone_object = function (obj) {
    return JSON.parse(JSON.stringify(obj));
}

function intercept_circle_line(circle, line) {
    var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
    v1 = {};
    v2 = {};
    v1.x = line.p2.x - line.p1.x;
    v1.y = line.p2.y - line.p1.y;
    v2.x = line.p1.x - circle.center.x;
    v2.y = line.p1.y - circle.center.y;
    b = (v1.x * v2.x + v1.y * v2.y);
    c = 2 * (v1.x * v1.x + v1.y * v1.y);
    b *= -2;
    d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
    if (isNaN(d)) { // no intercept
        return [];
    }
    u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
    u2 = (b + d) / c;
    retP1 = {};   // return points
    retP2 = {}
    ret = []; // return array
    if (u1 <= 1 && u1 >= 0) {  // add point if on the line segment
        retP1.x = line.p1.x + v1.x * u1;
        retP1.y = line.p1.y + v1.y * u1;
        ret[0] = retP1;
    }
    if (u2 <= 1 && u2 >= 0) {  // second add point if on the line segment
        retP2.x = line.p1.x + v1.x * u2;
        retP2.y = line.p1.y + v1.y * u2;
        ret[ret.length] = retP2;
    }
    return ret;
}


class World {

    constructor(props) {

        this.id = 1;

        this.width = props.width;
        this.height = props.height;
        this.entities = [];

        for (var i = 0; i < 150; i++) {
            this.entities.push(new Entity(this, {
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                angle: Math.random() * 360,
                size: 0 + Math.random() * 2
            }));
        }


        var test_entity = new Entity(this, {
            x: this.width / 2,
            y: this.height / 2,
            angle: 0,
            size: 2
        })

        this.entities.push(test_entity);
        //
        // var x=20;
        //
        // setInterval(() => {
        //     var clone = test_entity.clone();
        //     clone.props.x = x;
        //     x=x+40
        // }, 100);

    }

    get_next_id() {
        return this.id++;
    }

}

class Sim {
    constructor(world) {
        this.world = world;
    }

    start(speed) {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(function () {
            sim.tick();
        }, speed);
    }

    tick() {
        for (let entity of this.world.entities) {
            entity.tick();
        }
    }
}

class Renderer {
    constructor(world, context) {
        this.world = world;
        this.context = context;
    }

    render() {
        // clear the canvas
        this.context.clearRect(0, 0, this.world.width, this.world.height);
        for (let entity of this.world.entities) {
            entity.draw(this.context);
        }
    }
}


class Cell {
    constructor(entity, root, props) {

        this.root = root;
        this.entity = entity;
        this.props = props;

        this.init({
            angle_offset: 0,
            attach_offset: 0
        });

        this.id = entity.world.get_next_id();
        this.fluid_wave = Math.random();

        this.children = [];
    }


    init(props) {
        for (let key in props) {
            if (this.props[key]) {
                continue;
            }
            this.props[key] = props[key];
        }
    }

    draw(ctx) {

        //this.tick();

        ctx.strokeStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(this.props.x, this.props.y, (this.props.size * this.entity.growth), 0, 2 * Math.PI);
        ctx.stroke();

        //this.props.angle += 2;

            for (let child of this.children) {

                child.draw(ctx);

                // // Calculate angle from parent to child
                // var angle = Math.atan2(child.props.y - this.props.y, child.props.x - this.props.x) * 180 / Math.PI;
                //
                // /* Draw bond */
                // ctx.strokeStyle = "#FFFFFF";
                // ctx.beginPath();
                // var ox = Math.cos(angle * (Math.PI / 180)) * (this.props.size);
                // var oy = Math.sin(angle * (Math.PI / 180)) * (this.props.size);
                // ctx.moveTo(this.props.x + ox, this.props.y + oy);
                //
                // var ox = Math.cos(angle * (Math.PI / 180)) * (child.props.size);
                // var oy = Math.sin(angle * (Math.PI / 180)) * (child.props.size);
                // ctx.lineTo(child.props.x - ox, child.props.y - oy);
                // ctx.stroke();

            }

    }

    split(depth) {
        var size = 4 + Math.random() ;

        var cell_class = Cell;

        if (Math.random() > .7) {
            cell_class = MuscleCell;
        }

        if (Math.random() > .8) {
            cell_class = MouthCell;
        }

        if (Math.random() > .8) {
            cell_class = EyeCell;
        }

        var child = new cell_class(this.entity, this, {
            angle: Math.random() * 360,
            distance: this.props.size + size + (Math.random() * 10) + 2,
            size: size,
            parent_id: this.id,
        })

        this.children.push(child);

        for (var i = 0; i < 3; i++) {

            depth--;

            if (depth > 0) {
                child.split(depth);
            }
        }
    }

    tick() {

        this.props.angle_offset = Math.sin(this.fluid_wave) * 10;
        this.fluid_wave += .1;

        var angle = this.root.props.angle + this.props.angle + this.props.angle_offset; // + this.props.attach_offset;

        this.props.x = this.root.props.x + Math.cos(angle * (Math.PI / 180)) * (this.props.distance) * this.entity.growth;
        this.props.y = this.root.props.y + Math.sin(angle * (Math.PI / 180)) * (this.props.distance) * this.entity.growth;

        // console.log("Tick", this.id, angle, this.props.x, this.props.y, this.root, this.root.props.x, this.root.props.y)

        //

//         var closeset = null;
//         var distance = null;
//
//         for(var cell of this.entity.get_cells()) {
//
//             if(cell == this) {
//                 continue;
//             }
//
//             var cell_distance = Math.abs(this.props.x - cell.props.x) + Math.abs(this.props.y - cell.props.y);
//
//
//             var needed_distance = cell.props.size + this.props.size + 2;
//
//             if(cell_distance < needed_distance) {
//
//                 if(closeset == null) {
//                     closeset = cell;
//                 } else {
//                     if(cell_distance < distance) {
//                         closeset = cell;
//                     }
//                 }
//
//                 distance = cell_distance;
//
//             }
//
//             // if(distance == null) {
//             //     distance = cell_distance;
//             // }
//             //
//             // if(cell_distance < distance) {
//             //         closeset = cell;
//             //     }
//             // }
//
//             //console.log(cell_distance)
//
// //            console.log(cell, cell.id, this.props, this.props.x, cell.props.x, this.props.y, cell.props.y, distance)
//         }
//
//         //console.log(distance)
//
//         if(closeset && this.id != 0) {
//
//             //console.log("Collision!", distance);
//             this.props.angle += Math.random() * 360;
//
//         }

        // console.log(closeset, distance);

        // if(this.id == 3) {
        //     this.props.angle += Math.random() * 10;
        // }

            for (let child of this.children) {
                //console.log(this.id, child.props)
                child.tick();
            }
    }

    clone(entity, root) {

        if (!root) {
            var attach_to = entity;
        } else {
            var attach_to = root;
        }

        var cell = new this.constructor(entity, attach_to, clone_object(this.props));

        if (!root) {
            root = cell;
        }

        for (var child of this.children) {
            cell.children.push(child.clone(entity, root));
        }

        return cell;
    }

}


class MuscleCell extends Cell {

    constructor(entity, root, props) {
        super(entity, root, props);

        this.init({
            contraction: 0,
            contraction_cycle: 0,
            power: Math.random() + .1
        })

    }

    draw(ctx) {
        super.draw(ctx);
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(this.props.x, this.props.y, this.props.size / 2, 0, 2 * Math.PI);
        ctx.fill();

    }

    tick() {
        super.tick();

        this.props.contraction = Math.sin(this.props.contraction_cycle) * 10;
        this.props.contraction_cycle += this.props.power;
        this.props.angle += this.props.contraction;

        var speed = Math.abs((this.props.contraction - 40) / 50);
        var angle = this.root.props.angle + this.props.angle + this.props.angle_offset;

        this.entity.props.vector_x -= Math.cos(angle * (Math.PI / 180)) * speed;
        this.entity.props.vector_y -= Math.sin(angle * (Math.PI / 180)) * speed;

    }

}


class MouthCell extends Cell {

    constructor(entity, root, props) {
        super(entity, root, props);
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.fillStyle = "#ff7842";
        ctx.beginPath();
        ctx.arc(this.props.x, this.props.y, this.props.size / 2, 0, 2 * Math.PI);
        ctx.fill();

    }

    tick() {
        super.tick();

        if(this.entity.growth < .5) {
            return; /* Too small to eat */
        }

        var entity_close_by = this.entity.find_entity_at(this.props.x, this.props.y, 20);

        if (entity_close_by) {

            entity_close_by.kill();

            this.entity.energy += 1;

        }

    }
}

class EyeCell extends Cell {

    constructor(entity, root, props) {
        super(entity, root, props);
        this.target_locked = false;
        this.init({
            steer: (Math.random() - 2)
        });
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.fillStyle = "#37b7e2";
        ctx.beginPath();

        if (this.target_locked) {
            var radius = this.props.size / 1.5;
        } else {
            var radius = this.props.size / 3;
        }

        ctx.arc(this.props.x, this.props.y, radius, 0, 2 * Math.PI);
        ctx.fill();
    }

    tick() {
        super.tick();

        var entity_close_by = this.entity.find_entity_at(this.props.x, this.props.y, 80);

        if (entity_close_by) {
            this.target_locked = true;
            this.entity.props.angle_velocity_target = this.props.steer;
        } else {
            this.target_locked = false;
            this.entity.props.angle_velocity_target = 0;
        }

    }
}


class Entity {
    constructor(world, props) {

        this.id = world.get_next_id();
        this.world = world;
        this.props = props;

        this.energy = 0;
        this.growth = 0;

        this.props.angle_velocity_target = 0;
        this.props.angle_velocity = 0;
        this.props.vector_x = 0;
        this.props.vector_y = 0;

        this.root = new Cell(this, this, {
            size: this.props.size,
            angle: 0,
            distance: 0,
        });

        // this.root.children.push(new Cell(this, this.root, {
        //     size: 10,
        //     angle: 0,
        //     distance: 30,
        // }));

        this.build();
    }

    build() {
        for (var i = 0; i < 2; i++) {
            this.root.split(this.props.size);
        }
    }

    draw(ctx) {
        this.root.draw(ctx, this.props.x, this.props.y);
        ctx.strokeStyle = "#fff";

        ctx.beginPath();
        var first_point = null;
        for (var angle = 0; angle < 360; angle += 6) {

            var rx = this.props.x + Math.cos((this.props.angle + angle) * (Math.PI / 180)) * 200;
            var ry = this.props.y + Math.sin((this.props.angle + angle) * (Math.PI / 180)) * 200;

            var ix = this.props.x;
            var iy = this.props.y;
            var distance = 0;
            for (var cell of this.get_cells()) {

                var intersect = intercept_circle_line({
                    center: {
                        x: cell.props.x,
                        y: cell.props.y
                    },
                    radius: cell.props.size + (6 * this.growth)
                }, {
                    p1: {x: this.props.x, y: this.props.y},
                    p2: {x: rx, y: ry}
                });

                if (intersect.length > 0) {

                    var im = intersect.pop();

                    var d1 = Math.abs(im.x - this.props.x) + Math.abs(im.y - this.props.y);
                    if (d1 > distance) {

                        ix = im.x;
                        iy = im.y;
                        distance = d1;
                    }
                }

            }

            if (!first_point) {
                ctx.moveTo(ix, iy);
                first_point = [ix, iy]
            } else {
                ctx.lineTo(ix, iy);
            }

        }
        ctx.lineTo(first_point[0], first_point[1]);

        ctx.stroke();


    }

    tick() {
        // console.log(this.props.propulsion)

        this.props.vector_x = 0;
        this.props.vector_y = 0;

        this.root.tick();

        if(this.growth < 1) {
            this.growth = this.growth + .01;
        }

        if(this.energy > 0 && (Math.random() * 10) < 1) {
            this.clone();
            this.energy --;
        }


        this.props.x += this.props.vector_x;
        this.props.y += this.props.vector_y;

        this.props.angle += this.props.angle_velocity;

        if (this.props.angle > 360) {
            this.props.angle = 0;
        }

        if (this.props.angle < 0) {
            this.props.angle = 360;
        }

        if (this.props.angle_velocity_target > this.props.angle_velocity) {
            this.props.angle_velocity += .1;
        }

        if (this.props.angle_velocity_target < this.props.angle_velocity) {
            this.props.angle_velocity -= .1;
        }

        this.root.props.x = this.props.x;
        this.root.props.y = this.props.y;
        this.root.props.angle = this.props.angle;


        if (this.props.x < 0) {
            this.props.x = this.world.width;
        }
        if (this.props.y < 0) {
            this.props.y = this.world.width;
        }
        if (this.props.x > this.world.width) {
            this.props.x = 0;
        }
        if (this.props.y > this.world.width) {
            this.props.y = 0;
        }


    }

    get_cells(cell, cells) {

        if (!cell) {
            cells = [];
            cell = this.root;
            cells.push(cell);
        }

        for (let child of cell.children) {
            cells.push(child)
            this.get_cells(child, cells);
        }

        return cells;
    }

    find_entity_at(x, y, search_distance) {

        var found_distance = null;
        var found_entity = null;

        for (let entity of this.world.entities) {

            if (entity == this) {
                continue;
            }

            var distance = Math.abs(x - entity.props.x) + Math.abs(y - entity.props.y);

            if (distance > search_distance) {
                continue;
            }

            if (found_distance == null || distance < found_distance) {
                found_distance = distance;
                found_entity = entity;
            }
        }

        return found_entity;
    }

    kill() {
        let index = this.world.entities.indexOf(this);
        if (index == -1) {
            return;
        }
        this.world.entities.splice(index, 1);

        console.log("Killed entity " + this.id)
    }

    clone() {

        var new_entity = new Entity(this.world, clone_object(this.props));

        new_entity.root = this.root.clone(new_entity, null);

        this.world.entities.push(new_entity);

        var clone_angle = Math.random() * 360;

        new_entity.props.x = this.props.x + Math.cos(clone_angle * (Math.PI / 180)) * (40);
        new_entity.props.y = this.props.y + Math.sin(clone_angle * (Math.PI / 180)) * (40);
        new_entity.props.angle = clone_angle;

        return new_entity
    }
}


class ToolBox {
    constructor(el, props) {

        this.el = el;
        this.props = props;

        this.boosting = false;

        this.el.addEventListener("click", (e) => {
            this.execute(e.target.getAttribute("id"));
        });
    }

    execute(action) {

        if (this.boosting) {
            this.props.sim.start(40);
        } else {
            this.props.sim.start(1);
        }

        this.boosting = !this.boosting;

    }

}