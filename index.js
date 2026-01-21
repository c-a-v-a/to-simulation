// src/Constants.ts
class Constants {
  static MIN_X = 49.95855025648944;
  static MAX_X = 50.154564013341734;
  static MIN_Y = 19.688292482742394;
  static MAX_Y = 20.02470275868903;
  static LOCAL_DANGER_CHANCE = 0.7;
  static FIRE_CHANCE = 0.3;
  static FALSE_ALARM_CHANCE = 0.05;
  static TRUCK_COUNT = 5;
  static CANVAS_SIZE = 1000;
}

// src/RequestState.ts
var RequestState;
((RequestState2) => {
  RequestState2[RequestState2["Fire"] = 0] = "Fire";
  RequestState2[RequestState2["LocalDanger"] = 1] = "LocalDanger";
})(RequestState ||= {});
var RequestState_default = RequestState;

// src/Request.ts
class Request {
  x;
  y;
  state;
  constructor(x, y) {
    if (Math.random() <= Constants.LOCAL_DANGER_CHANCE) {
      this.state = RequestState_default.LocalDanger;
    } else {
      this.state = RequestState_default.Fire;
    }
    this.x = x;
    this.y = y;
  }
  getX() {
    return this.x;
  }
  getY() {
    return this.y;
  }
  getState() {
    return this.state;
  }
  getStateString() {
    return this.state === RequestState_default.LocalDanger ? "LD" : "F";
  }
}

// src/RequestIterator.ts
class RequestIterator {
  next() {
    return new Request(Math.random() * (Constants.MAX_X - Constants.MIN_X) + Constants.MIN_X, Math.random() * (Constants.MAX_Y - Constants.MIN_Y) + Constants.MIN_Y);
  }
}

// src/Requests.ts
class Requests {
  getIterator() {
    return new RequestIterator;
  }
}

// src/StrategyFire.ts
class StrategyFire {
  trucksNeeded = 3;
  async execute(responses, request, units) {
    const sortedResponses = responses.sort((a, b) => a.getDistance() - b.getDistance());
    const selectedTrucks = this.selectTrucks(sortedResponses);
    const trucksString = this.getTrucksString(selectedTrucks);
    if (selectedTrucks.length < this.trucksNeeded) {
      return false;
    }
    for (const truck of selectedTrucks) {
      units.find((unit) => truck.getName().startsWith(unit.getName()))?.addRequest(request);
      truck.rollOut();
    }
    console.log(`TRUCKS ${trucksString} ROLL OUT`);
    await new Promise((r) => setTimeout(r, Math.random() * 3000));
    console.log(`TRUCKS ${trucksString} ARRIVED`);
    if (Math.random() <= Constants.FALSE_ALARM_CHANCE) {
      console.log("FALSE ALARM");
    } else {
      await new Promise((r) => setTimeout(r, Math.random() * (25000 - 5000) + 5000));
      console.log("MISSION DONE");
    }
    await new Promise((r) => setTimeout(r, Math.random() * 3000));
    for (const truck of selectedTrucks) {
      truck.goBack();
    }
    for (const unit of units) {
      if (unit.getRequests().includes(request)) {
        unit.getRequests().splice(unit.getRequests().indexOf(request), 1);
      }
    }
    console.log(`TRUCKS ${trucksString} WENT BACK`);
    return true;
  }
  selectTrucks(responses) {
    const selectedTrucks = [];
    for (const response of responses) {
      for (const truck of response.getAvailableTrucks()) {
        selectedTrucks.push(truck);
        if (selectedTrucks.length >= this.trucksNeeded) {
          return selectedTrucks;
        }
      }
    }
    return selectedTrucks;
  }
  getTrucksString(trucks) {
    const names = trucks.map((truck) => truck.getName());
    const str = names.join(" ");
    return `[${str}]`;
  }
}

// src/StrategyLocalDanger.ts
class StrategyLocalDanger {
  trucksNeeded = 2;
  async execute(responses, request, units) {
    const sortedResponses = responses.sort((a, b) => a.getDistance() - b.getDistance());
    const selectedTrucks = this.selectTrucks(sortedResponses);
    const trucksString = this.getTrucksString(selectedTrucks);
    if (selectedTrucks.length < this.trucksNeeded) {
      return false;
    }
    for (const truck of selectedTrucks) {
      units.find((unit) => truck.getName().startsWith(unit.getName()))?.addRequest(request);
      truck.rollOut();
    }
    console.log(`TRUCKS ${trucksString} ROLL OUT`);
    await new Promise((r) => setTimeout(r, Math.random() * 3000));
    console.log(`TRUCKS ${trucksString} ARRIVED`);
    if (Math.random() <= Constants.FALSE_ALARM_CHANCE) {
      console.log("FALSE ALARM");
    } else {
      await new Promise((r) => setTimeout(r, Math.random() * (25000 - 5000) + 5000));
      console.log("MISSION DONE");
    }
    await new Promise((r) => setTimeout(r, Math.random() * 3000));
    for (const truck of selectedTrucks) {
      truck.goBack();
    }
    for (const unit of units) {
      if (unit.getRequests().includes(request)) {
        unit.getRequests().splice(unit.getRequests().indexOf(request), 1);
      }
    }
    console.log(`TRUCKS ${trucksString} WENT BACK`);
    return true;
  }
  selectTrucks(responses) {
    const selectedTrucks = [];
    for (const response of responses) {
      for (const truck of response.getAvailableTrucks()) {
        selectedTrucks.push(truck);
        if (selectedTrucks.length >= this.trucksNeeded) {
          return selectedTrucks;
        }
      }
    }
    return selectedTrucks;
  }
  getTrucksString(trucks) {
    const names = trucks.map((truck) => truck.getName());
    const str = names.join(" ");
    return `[${str}]`;
  }
}

// src/TruckStateAvailable.ts
class TruckStateAvailable {
  isAvailable() {
    return true;
  }
}

// src/TruckStateGone.ts
class TruckStateGone {
  isAvailable() {
    return false;
  }
}

// src/Truck.ts
class Truck {
  name;
  state;
  constructor(name) {
    this.name = name;
    this.state = new TruckStateAvailable;
  }
  getName() {
    return this.name;
  }
  isAvailable() {
    return this.state.isAvailable();
  }
  rollOut() {
    this.state = new TruckStateGone;
  }
  goBack() {
    this.state = new TruckStateAvailable;
  }
}

// src/UnitResponse.ts
class UnitResponse {
  distance;
  availableTrucks;
  constructor(distance, trucks) {
    this.distance = distance;
    this.availableTrucks = trucks.filter((truck) => truck.isAvailable());
  }
  getDistance() {
    return this.distance;
  }
  getAvailableTrucks() {
    return this.availableTrucks;
  }
}

// src/Unit.ts
class Unit {
  name;
  requests = [];
  trucks;
  x;
  y;
  constructor(name, x, y, trucksCount) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.trucks = [];
    for (let i = 0;i < trucksCount; i++)
      this.trucks.push(new Truck(`${this.name}-${i}`));
  }
  getName() {
    return this.name;
  }
  update(request) {
    return new UnitResponse(this.calculateDistance(request), this.trucks);
  }
  calculateDistance(request) {
    return Math.sqrt((this.x - request.getX()) ** 2 + (this.y - request.getY()) ** 2);
  }
  addRequest(request) {
    if (!this.requests.includes(request)) {
      this.requests.push(request);
    }
  }
  removeRequest(request) {
    if (this.requests.includes(request)) {
      this.requests.splice(this.requests.indexOf(request), 1);
    }
  }
  getRequests() {
    return this.requests;
  }
  getX() {
    return this.x;
  }
  getY() {
    return this.y;
  }
  getLabel() {
    const availableTrucks = this.trucks.filter((truck) => truck.isAvailable());
    return `${this.name} [${availableTrucks.length}/${this.trucks.length}]`;
  }
}

// src/SKKM.ts
class SKKM {
  strategy;
  units = [];
  requestQueue = [];
  constructor() {
    this.addObserver(new Unit("JRG-1", 50.06005228623131, 19.943127236434425, Constants.TRUCK_COUNT));
    this.addObserver(new Unit("JRG-2", 50.033537528025185, 19.935837168700054, Constants.TRUCK_COUNT));
    this.addObserver(new Unit("JRG-3", 50.07588593762735, 19.887345955209387, Constants.TRUCK_COUNT));
    this.addObserver(new Unit("JRG-4", 50.03782642661006, 20.005766197535944, Constants.TRUCK_COUNT));
    this.addObserver(new Unit("JRG-5", 50.092018031278926, 19.920027697538377, Constants.TRUCK_COUNT));
    this.addObserver(new Unit("JRG-6", 50.0160573055595, 20.015639068699144, Constants.TRUCK_COUNT));
    this.addObserver(new Unit("JRG-7", 50.09422957989656, 19.977393811030918, Constants.TRUCK_COUNT));
  }
  setStrategy(strategy) {
    this.strategy = strategy;
  }
  addObserver(unit) {
    this.units.push(unit);
  }
  notifyAll(request) {
    return this.units.map((unit) => unit.update(request));
  }
  async onNewRequest(request) {
    console.log(`NEW REQUEST [${request.getStateString()}] AT ${request.getX()}, ${request.getY()}`);
    this.requestQueue.push(request);
    if (request.getState() === RequestState_default.LocalDanger) {
      this.setStrategy(new StrategyLocalDanger);
    } else {
      this.setStrategy(new StrategyFire);
    }
    const current = this.requestQueue.shift();
    const result = await this.strategy?.execute(this.notifyAll(current), current, this.units);
    if (!result) {
      this.requestQueue.push(current);
    }
  }
  getUnits() {
    return this.units;
  }
  getRequestQueue() {
    return this.requestQueue;
  }
}

// src/index.ts
var requests = new Requests;
var intervalDelta = 1000 / 25;
var skkm = new SKKM;
var isRunning = false;
var interval = null;
function start() {
  if (interval !== null) {
    isRunning = true;
    return;
  }
  const iterator = requests.getIterator();
  const canvas = document.getElementById("canvas");
  let elapsed = 0;
  canvas.width = Constants.CANVAS_SIZE;
  isRunning = true;
  interval = setInterval(() => {
    if (elapsed >= 1000) {
      if (Math.random() > 0.25 && isRunning) {
        const request = iterator.next();
        skkm.onNewRequest(request);
      }
      elapsed = 0;
    }
    draw();
    elapsed += intervalDelta;
  }, intervalDelta);
}
function stop() {
  if (interval === null) {
    return;
  }
  isRunning = false;
}
function draw() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const request of skkm.getRequestQueue()) {
    const coordinates = toCoords(request.getX(), request.getY());
    ctx.beginPath();
    ctx.arc(coordinates[0], coordinates[1], 10, 0, Math.PI * 2);
    if (request.getState() === RequestState_default.LocalDanger) {
      ctx.fillStyle = "orange";
    } else {
      ctx.fillStyle = "red";
    }
    ctx.fill();
  }
  for (const unit of skkm.getUnits()) {
    const unitCoordinates = toCoords(unit.getX(), unit.getY());
    for (const request of unit.getRequests()) {
      const coordinates = toCoords(request.getX(), request.getY());
      ctx.beginPath();
      ctx.arc(coordinates[0], coordinates[1], 10, 0, Math.PI * 2);
      if (request.getState() === RequestState_default.LocalDanger) {
        ctx.fillStyle = "orange";
      } else {
        ctx.fillStyle = "red";
      }
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(unitCoordinates[0], unitCoordinates[1]);
      ctx.lineTo(coordinates[0], coordinates[1]);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(unitCoordinates[0], unitCoordinates[1], 10, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "15px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(unit.getLabel(), unitCoordinates[0], unitCoordinates[1] + 15);
  }
}
function toCoords(x, y) {
  return [
    (x - Constants.MIN_X) / (Constants.MAX_X - Constants.MIN_X) * Constants.CANVAS_SIZE,
    (y - Constants.MIN_Y) / (Constants.MAX_Y - Constants.MIN_Y) * Constants.CANVAS_SIZE
  ];
}
draw();
document.getElementById("start-button").onclick = () => start();
document.getElementById("stop-button").onclick = () => stop();
