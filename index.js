// src/coordinates/Coordinates.ts
class Coordinates {
  x;
  y;
  constructor(maxX, maxY) {
    this.x = Math.random() * maxX;
    this.y = Math.random() * maxY;
  }
  getX() {
    return this.x;
  }
  getY() {
    return this.y;
  }
}

// src/coordinates/CoordinatesIterator.ts
class CoordinatesIterator {
  maxX = 1000;
  maxY = 1000;
  hasNext() {
    return true;
  }
  getNext() {
    return new Coordinates(this.maxX, this.maxY);
  }
}

// src/coordinates/CoordinatesCollections.ts
class CoordinatesCollection {
  static instance;
  constructor() {}
  static getInstance() {
    if (!this.instance) {
      this.instance = new CoordinatesCollection;
    }
    return this.instance;
  }
  createIterator() {
    return new CoordinatesIterator;
  }
}

// src/DeliveryContract.ts
class DeliveryContract {
  from;
  amount;
  time;
  constructor(from, amount, time) {
    this.from = from;
    this.amount = amount;
    this.time = time;
  }
  getFrom() {
    return this.from;
  }
  getAmount() {
    return this.amount;
  }
  getTime() {
    return this.time;
  }
  tick() {
    this.time--;
  }
}

// src/producers/strategies/ProducerStrategyOptimal.ts
class ProducerStrategyOptimal {
  adjustProduction(current) {
    return current;
  }
}

// src/producers/Producer.ts
class Producer {
  x;
  y;
  productionRate;
  stockpile;
  strategy;
  name;
  closed;
  maxRate = 25;
  minRate = 10;
  constructor(x, y, name) {
    this.x = x;
    this.y = y;
    this.productionRate = Math.floor(Math.random() * (this.maxRate - this.minRate) + this.minRate);
    this.stockpile = 0;
    this.strategy = new ProducerStrategyOptimal;
    this.name = name;
    this.closed = false;
  }
  getX() {
    return this.x;
  }
  getY() {
    return this.y;
  }
  getStockpile() {
    return this.stockpile;
  }
  getProductionRate() {
    return this.productionRate;
  }
  getName() {
    return this.name;
  }
  isClosed() {
    return this.closed;
  }
  setStrategy(strategy) {
    this.strategy = strategy;
  }
}

// src/producers/strategies/ProducerStateOverproducing.ts
class ProducerStrategyOverproducing {
  adjustProduction(current) {
    return current - Math.floor((Math.random() * 0.1 + 0.1) * current);
  }
}

// src/producers/strategies/ProducerStateUnderproducing.ts
class ProducerStrategyUnderproducing {
  adjustProduction(current) {
    return Math.floor(current + (Math.random() * 0.1 + 0.1) * current);
  }
}

// src/producers/ProducerB.ts
class ProducerB extends Producer {
  constructor(x, y, name) {
    super(x, y, name);
    this.productionRate = Math.floor(this.productionRate);
  }
  produce() {
    this.stockpile = Math.min(this.stockpile + this.productionRate, 6 * this.productionRate);
  }
  weeklyUpdate() {
    if (this.stockpile > 2 * this.productionRate) {
      this.setStrategy(new ProducerStrategyOverproducing);
    } else if (this.stockpile < 0.5 * this.productionRate) {
      this.setStrategy(new ProducerStrategyUnderproducing);
    } else {
      this.setStrategy(new ProducerStrategyOptimal);
    }
    this.productionRate = this.strategy.adjustProduction(this.productionRate);
    if (this.productionRate > this.maxRate) {
      this.productionRate = this.maxRate;
    }
    if (this.productionRate < this.minRate || this.stockpile >= 6 * this.productionRate) {
      this.closed = true;
    }
  }
  deliver(amount, time) {
    this.stockpile -= amount;
    return new DeliveryContract(this, amount, time);
  }
}

// src/producers/creators/CreatorProducerB.ts
class CreatorProducerB {
  create(name) {
    const collection = CoordinatesCollection.getInstance();
    const coordinates = collection.createIterator().getNext();
    return new ProducerB(coordinates.getX(), coordinates.getY(), name);
  }
}

// src/producers/ProducerA.ts
class ProducerA extends Producer {
  subProducerCreator;
  subProducers;
  resourceBStockpile;
  resourceBBottlenecks;
  subProducerTracker = 3;
  contracts;
  constructor(x, y, name) {
    super(x, y, name);
    this.minRate = 25;
    this.maxRate = 100;
    this.productionRate = Math.floor(Math.random() * (this.maxRate - this.minRate) + this.minRate);
    this.resourceBBottlenecks = 0;
    this.resourceBStockpile = 0;
    this.subProducers = [];
    this.subProducerCreator = new CreatorProducerB;
    this.subProducers.push(this.subProducerCreator.create("PB-1"));
    this.subProducers.push(this.subProducerCreator.create("PB-2"));
    this.subProducers.push(this.subProducerCreator.create("PB-3"));
    this.contracts = [];
  }
  produce() {
    this.notifyAll();
    const sorted = this.subProducers.filter((producer) => !producer.isClosed()).sort((a, b) => {
      return b.getProductionRate() - a.getProductionRate() || this.getTime(a) - this.getTime(b);
    });
    this.recieveContracts();
    this.makeContracts(sorted);
    if (this.resourceBStockpile < this.productionRate) {
      this.resourceBBottlenecks++;
      this.stockpile += this.resourceBStockpile;
      this.resourceBStockpile = 0;
    } else {
      this.stockpile += this.productionRate;
      this.resourceBStockpile -= this.productionRate;
    }
  }
  weeklyUpdate() {
    this.subProducers = this.subProducers.filter((producer) => !producer.isClosed());
    this.productionRate = this.strategy.adjustProduction(this.productionRate);
    if (this.resourceBBottlenecks > 0 && this.strategy instanceof ProducerStrategyUnderproducing) {
      this.subProducerTracker++;
      this.subProducers.push(this.subProducerCreator.create(`PB-${this.subProducerTracker}`));
    }
    for (const p of this.subProducers) {
      p.weeklyUpdate();
    }
    this.resourceBBottlenecks = 0;
  }
  notifyAll() {
    for (const p of this.subProducers) {
      p.produce();
    }
    for (const c of this.contracts) {
      c.tick();
    }
  }
  makeContracts(producers) {
    let goal = Math.floor(1.1 * this.productionRate);
    for (const producer of producers) {
      const amount = Math.min(goal, producer.getStockpile());
      this.contracts.push(producer.deliver(amount, this.getTime(producer)));
      goal -= amount;
      if (goal <= 0) {
        break;
      }
    }
  }
  recieveContracts() {
    for (const contract of this.contracts) {
      if (contract.getTime() <= 0) {
        this.resourceBStockpile += contract.getAmount();
      }
    }
    this.contracts = this.contracts.filter((contract) => contract.getTime() > 0);
  }
  getTime(to) {
    const distance = Math.sqrt((this.x - to.getX()) ** 2 + (this.y - to.getY()) ** 2);
    return Math.floor(distance / 100) + 1;
  }
  deliver(amount) {
    this.stockpile -= amount;
    return amount;
  }
  getSubproducers() {
    return this.subProducers;
  }
  getContracts() {
    return this.contracts;
  }
  getStockpileB() {
    return this.resourceBStockpile;
  }
}

// src/Consumer.ts
class Consumer {
  static instance;
  producer;
  weeklyQuota;
  deliveredProducts;
  wasMet;
  constructor() {
    this.producer = new ProducerA(500, 500, "PA-1");
    this.weeklyQuota = Math.floor(Math.random() * (100 - 25) + 25) * 7;
    this.deliveredProducts = 0;
    this.wasMet = false;
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new Consumer;
    }
    return this.instance;
  }
  dialyUpdate() {
    this.producer.produce();
  }
  weeklyUpdate() {
    this.deliveredProducts = this.producer.deliver(Math.min(this.weeklyQuota, this.producer.getStockpile()));
    if (this.deliveredProducts < this.weeklyQuota) {
      this.producer.setStrategy(new ProducerStrategyUnderproducing);
      this.wasMet = false;
    } else if (this.producer.getStockpile() > 0.2 * this.weeklyQuota) {
      this.producer.setStrategy(new ProducerStrategyOverproducing);
      this.wasMet = true;
    } else {
      this.producer.setStrategy(new ProducerStrategyOptimal);
      this.wasMet = true;
    }
    this.producer.weeklyUpdate();
    if (Math.random() > 0.5) {
      this.weeklyQuota = Math.floor(this.weeklyQuota + this.weeklyQuota * (Math.random() * 0.2 - 0.1));
    }
    this.deliveredProducts = 0;
  }
  getProducer() {
    return this.producer;
  }
  getQuota() {
    return this.weeklyQuota;
  }
  getWasMet() {
    return this.wasMet;
  }
}

// src/index.ts
var dayCounter = 0;
var isRunning = false;
var interval = null;
var consumer = Consumer.getInstance();
var canvas = document.getElementById("canvas");
var nextButton = document.getElementById("next-button");
var startButton = document.getElementById("start-button");
var stopButton = document.getElementById("stop-button");
var dispaly = document.getElementById("display");
function draw() {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const producerA = consumer.getProducer();
  ctx.strokeStyle = "lightgray";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(producerA.getX(), producerA.getY(), 100, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(producerA.getX(), producerA.getY(), 200, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(producerA.getX(), producerA.getY(), 300, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(producerA.getX(), producerA.getY(), 400, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(producerA.getX(), producerA.getY(), 500, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(producerA.getX(), producerA.getY(), 600, 0, Math.PI * 2);
  ctx.stroke();
  for (const p of producerA.getSubproducers()) {
    ctx.beginPath();
    ctx.arc(p.getX(), p.getY(), 10, 0, Math.PI * 2);
    ctx.fillStyle = "cyan";
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "15px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(p.getName(), p.getX(), p.getY() + 20);
  }
  for (const c of producerA.getContracts()) {
    ctx.beginPath();
    ctx.moveTo(producerA.getX(), producerA.getY());
    ctx.lineTo(c.getFrom().getX(), c.getFrom().getY());
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(producerA.getX(), producerA.getY(), 15, 0, Math.PI * 2);
  ctx.fillStyle = "green";
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "15px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(producerA.getName(), producerA.getX(), producerA.getY() + 20);
}
function displayInfo() {
  dispaly.innerHTML = "";
  dispaly.innerHTML += `
    <p> DAY: ${dayCounter} </p>
    <hr>
    <p>WEEKLY QUOTA: ${consumer.getQuota()}, LAST ${consumer.getWasMet() ? "WAS" : "WAS NOT"} MET</p>
    <hr>
    <p>${consumer.getProducer().getName()} Production: ${consumer.getProducer().getProductionRate()}/d</p>
    <p>${consumer.getProducer().getName()} Stockpile A: ${consumer.getProducer().getStockpile()}</p>
    <p>${consumer.getProducer().getName()} Stockpile B: ${consumer.getProducer().getStockpileB()}</p>
    <hr>
  `;
  for (const p of consumer.getProducer().getSubproducers()) {
    dispaly.innerHTML += `
      <p>${p.getName()} Production: ${p.getProductionRate()}/d</p>
      <p>${p.getName()} Stockpile: ${p.getStockpile()}</p>
      <hr>
    `;
  }
  for (const c of consumer.getProducer().getContracts()) {
    dispaly.innerHTML += `
      <p>CONTRACT: ${c.getFrom().getName()}, FOR: ${c.getAmount()}, IN: ${c.getTime()} days</p>
    `;
  }
}
function nextDay() {
  dayCounter++;
  consumer.dialyUpdate();
  if (dayCounter % 7 === 0) {
    consumer.weeklyUpdate();
  }
  draw();
  displayInfo();
}
nextButton.onclick = () => {
  if (!isRunning) {
    nextDay();
  }
};
startButton.onclick = () => {
  if (!isRunning) {
    isRunning = true;
    interval = setInterval(() => {
      if (isRunning) {
        nextDay();
      }
    }, 1000);
  }
};
stopButton.onclick = () => {
  isRunning = false;
  clearInterval(interval);
};
draw();
