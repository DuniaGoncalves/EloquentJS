var plan = ['############################',
            '#      #    #      o      ##',
            '#                          #',
            '#          #####           #',
            '##         #   #    ##     #',
            '###           ##     #     #',
            '#           ###      #     #',
            '#   ####                   #',
            '#   ##       o             #',
            '# o  #         o       ### #',
            '#    #                     #',
            '############################'];

function Vector(x, y) {
  this.x = x;
  this.y = y;
}

Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y)
};

// var grid = ['top left', 'top middle','top right',
//             'bottom left', 'bottom middle', 'bottom right'];

// console.log(grid[2 + (1 * 3)]);

function Grid(width, height) {
  this.space = new Array(width * height);
  this.width = width;
  this.height = height;
}

Grid.prototype.isInside = function(vector) {
  return vector.x >= 0 && vector.x < this.width &&
         vector.y >= 0 && vector.y < this.height;
};

Grid.prototype.get = function(vector) {
  return this.space[vector.x + this.width * vector.y];
};

Grid.prototype.set = function(vector, value) {
  this.space[vector.x + this.width * vector.y] = value;
};

// var grid = new Grid(5,5);
// console.log(grid.get(new Vector(1,1)));
// grid.set(new Vector(1,1), 'X');
// console.log(grid.get(new Vector(1,1)));

var directions = {
  'n':  new Vector( 0, -1),
  'ne': new Vector( 1, -1),
  'e':  new Vector( 1,  0),
  'se': new Vector( 1,  1),
  's':  new Vector( 0,  1),
  'sw': new Vector(-1,  1),
  'w':  new Vector(-1,  0),
  'nw': new Vector(-1, -1)
};

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

var directionNames = 'n ne e se s sw w nw'.split(' ');

function BouncingCritter() {
  this.direction = randomElement(directionNames);
};

BouncingCritter.prototype.act = function(view) {
  if (view.look(this.direction) != ' ') {
    this.direction = view.find(' ') || 's';
  }
  return {type: 'move', direction: this.direction};
};

//The World Object

function elementFromChar(legend, ch) {
  if (ch == ' ') {
    return null;
  }
  var element = new legend[ch]();
  element.originChar = ch;
  return element;
}

function World(map, legend, container) {
  var grid = new Grid(map[0].length, map.length);
  this.grid = grid;
  this.legend = legend;
  this.container = container;

  map.forEach(function(line, y) {
    for (var x = 0; x < line.length; x++) {
      grid.set(new Vector(x,y),
      elementFromChar(legend,line[x]));
    }
  });
}

function charFromElement(element) {
  if (element == null) {
    return ' ';
  } else {
    return element.originChar;
  }
}

World.prototype.toString = function() {
  var output = '';
  for (var y = 0; y < this.grid.height; y++) {
    for (var x = 0; x < this.grid.width; x++) {
      var element = this.grid.get(new Vector(x, y));
      output += charFromElement(element);
    }
    output += '\n';
  }
  return output;
};

function Wall() {}

var world = new World(plan, {'#': Wall, 'o': BouncingCritter});
// console.log(world.toString());

Grid.prototype.forEach = function(f, context) {
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      var value = this.space[x + y * this.width];
      if (value != null) {
        f.call(context, value, new Vector(x, y));
      }
    }
  }
};

var worldItems = {
  "#": 'wall',
  "O": 'plant-eater',
  "*": 'plant',
  "~": 'wall-follower',
  "@": 'tiger',
  "s": 'bouncing-critter'
}

function createItems(char){
  var items = worldItems[char];
  var output = "<td class='" + items + "'>" +
               char + "</td>"
  return output;
}

World.prototype.toHtmlTable = function() {
  var table = "<table>";
  var row = "";
  for (var y = 0; y < this.grid.height; y++) {
    row = "<tr>";
    for (var x = 0; x < this.grid.width; x++) {
      var element = this.grid.get(new Vector(x, y));
      row += createItems(charFromElement(element));
    }
    row = row + "</tr>";
    table += row;
  }
  table = table + "</table>";
  return table;
};

World.prototype.turn = function() {
  var acted = [];
  this.grid.forEach(function(critter, vector) {
    if (critter.act && acted.indexOf(critter) == -1) {
      acted.push(critter);
      this.letAct(critter, vector);
    }
  }, this);
  this.draw();
};

World.prototype.draw = function() {
  this.container.innerHTML = this.toHtmlTable();
  console.log(this.toString());
};

World.prototype.letAct = function(critter, vector) {
  var action = critter.act(new View(this, vector));
  if (action && action.type == 'move') {
    var dest = this.checkDestination(action, vector);
    if (dest && this.grid.get(dest) == null) {
      this.grid.set(vector, null);
      this.grid.set(dest, critter);
    }
  }
};

World.prototype.checkDestination = function(action, vector) {
  if (directions.hasOwnProperty(action.direction)) {
    var dest = vector.plus(directions[action.direction]);
    if (this.grid.isInside(dest)) {
      return dest;
    }
  }
};

function View(world, vector) {
  this.world = world;
  this.vector = vector;
}

View.prototype.look = function(dir) {
  var target = this.vector.plus(directions[dir]);
  if (this.world.grid.isInside(target)) {
    return charFromElement(this.world.grid.get(target));
  } else {
    return '#';
  }
};

View.prototype.findAll = function(ch) {
  var found = [];
  for (var dir in directions) {
    if (this.look(dir) == ch) {
      found.push(dir);
    }
  }
  return found;
};

View.prototype.find = function(ch) {
  var found = this.findAll(ch);
  if (found.length == 0) { return null; }
  return randomElement(found);
};

// for (var i = 0; i < 5; i++) {
//   world.turn();
//   console.log(world.toString());
// }

//animateWorld(world);

// More Life Forms

function dirPlus(dir, n) {
  var index = directionNames.indexOf(dir);
  return directionNames[(index + n + 8) % 8];
}

function WallFollower() {
  this.dir = 's';
}

WallFollower.prototype.act = function(view) {
  var start = this.dir;
  if (view.look(dirPlus(this.dir, -3)) != ' ') {
    start = this.dir = dirPlus(this.dir, -2);
  }
  while(view.look(this.dir) != ' ') {
    this.dir = dirPlus(this.dir, 1);
    if (this.dir == start) {
      break;
    }
  }
  return {type: 'move', direction: this.dir};
};

// More Lifelike Simulation
// have tigers follow nearest critters move through grass

World.prototype = Object.create(World.prototype);

var actionTypes = Object.create(null);

World.prototype.letAct = function(critter, vector) {
  var action = critter.act(new View(this, vector));
  var handled = action &&
    action.type in actionTypes &&
    actionTypes[action.type].call(this, critter,
                                  vector, action);
  if (!handled) {
    critter.energy -= 0.2;
    if (critter.energy <= 0) {
      this.grid.set(vector, null);
    }
  }
};

actionTypes.grow = function(critter) {
  critter.energy += 0.5;
  return true;
};

actionTypes.move = function(critter, vector, action) {
  var dest = this.checkDestination(action, vector);
  if (dest == null ||
      critter.energy <= 1 ||
      this.grid.get(dest) != null) {
    return false;
  }
  critter.energy -= 1;
  this.grid.set(vector, null);
  this.grid.set(dest, critter);
  return true;
};

actionTypes.eat = function(critter, vector, action) {
  var dest = this.checkDestination(action, vector);
  var atDest = dest != null && this.grid.get(dest);
  if (!atDest || atDest.energy == null) {
    return false;
  }
  critter.energy += atDest.energy;
  this.grid.set(dest, null);
  return true;
};

actionTypes.reproduce = function(critter, vector, action) {
  var baby = elementFromChar(this.legend,
                             critter.originChar);
  var dest = this.checkDestination(action, vector);
  if (dest == null ||
      critter.energy <= 2 * baby.energy ||
      this.grid.get(dest) != null) {
    return false;
  }
  critter.energy -= 2 * baby.energy;
  this.grid.set(dest, baby);
  return true;
};

// Populating
function Plant() {
  this.energy = 3 + Math.random() * 4;
}

Plant.prototype.act = function(view) {
  if (this.energy > 10 && space) {
    var space = view.find(' ');
    if (space) {
      return {type: 'reproduce', direction: space};
    }
  }
  if (this.energy < 15) {
    return {type: 'grow'};
  }
};

function PlantEater() {
  this.energy = 20;
}

PlantEater.prototype.act = function(view) {
  var space = view.find(' ');
  if (this.energy > 40 && space && this.energy < 85) {
    return {type: 'reproduce', direction: space};
  }
  var plant = view.find('*');
  if (plant) {
    return {type: 'eat', direction: plant};
  }
  if (space) {
    return {type: 'move', direction: space};
  }
};

function Tiger() {
  this.energy = 40;
}

Tiger.prototype.act = function(view) {
  var space = view.find(' ');
  if (this.energy > 55 && space) {
    return {type: 'reproduce', direction: space};
  }
  var plantEater = view.find('O');
  if (plantEater) {
    return {type: 'eat', direction: plantEater};
  }
  if (space) {
    return {type: 'move', direction: space};
  }
};

function animate(world) {
  var container = document.getElementById('#world');
}

function animateWorld() {
  var plan =
    ['############################',
     '#####         ~    O  ######',
     '##   ***      @         **##',
     '#   *##**         **     *##',
     '#    ***     O    ##**    *#',
     '#                 ##***    #',
     '#                 ##**     #',
     '#   s       #*             #',
     '#***        #**         O  #',
     '#***    O   ##**   s @   **#',
     '##****    s###***     ~ *###',
     '############################'];

  var container = document.getElementById('world');
  var world = new World(plan, { '#': Wall, 'O': PlantEater, 's': BouncingCritter, '*': Plant , '~': WallFollower, '@': Tiger }, container);

  var startBtn = document.getElementById('start');
  var stopBtn = document.getElementById('stop');
  (function loop(){
    world.turn(container);
    setTimeout(loop, 1000);
  })();


}

animateWorld();

// Exercises FINAL PART NEED TO DO

// Artificial Stupidity
// function SmartPlantEater() {}
//
// animateWorld(new LifelikeWorld(
//   ['############################',
//    '#####                 ######',
//    '##   ***                **##',
//    '#   *##**         **  O  *##',
//    '#    ***     O    ##**    *#',
//    '#       O         ##***    #',
//    '#                 ##**     #',
//    '#   O       #*             #',
//    '#*          #**       O    #',
//    '#***        ##**    O    **#',
//    '##****     ###***       *###',
//    '############################'],
//   {'#': Wall,
//    'O': SmartPlantEater,
//    '*': Plant}
// ));
//
// function Tiger() {}
//
// animateWorld(new LifelikeWorld(
//   ['####################################################',
//    '#                 ####         ****              ###',
//    '#   *  @  ##                 ########       OO    ##',
//    '#   *    ##        O O                 ****       *#',
//    '#       ##*                        ##########     *#',
//    '#      ##***  *         ****                     **#',
//    '#* **  #  *  ***      #########                  **#',
//    '#* **  #      *               #   *              **#',
//    '#     ##              #   O   #  ***          ######',
//    '#*            @       #       #   *        O  #    #',
//    '#*                    #  ######                 ** #',
//    '###          ****          ***                  ** #',
//    '#       O                        @         O       #',
//    '#   *     ##  ##  ##  ##               ###      *  #',
//    '#   **         #              *       #####  O     #',
//    '##  **  O   O  #  #    ***  ***        ###      ** #',
//    '###               #   *****                    ****#',
//    '####################################################'],
//   {'#': Wall,
//    '@': Tiger,
//    'O': SmartPlantEater, // from previous exercise
//    '*': Plant}
// ));

//animate in html not console
