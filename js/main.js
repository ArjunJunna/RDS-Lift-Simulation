const numOfFloors = document.getElementById("num-of-floors");
const numOfLifts = document.getElementById("num-of-lifts");
const submitButton = document.getElementById("submitButton");
const body = document.querySelector("body");
const form = document.querySelector(".form");
const mainContent = document.getElementById("main-content");

function validateUserInput(event) {
  const inputChar = String.fromCharCode(event.which || event.keyCode);
  if (!/^\d$/.test(inputChar)) {
    event.preventDefault();
    return;
  }
  const newValue = event.target.value + inputChar;
  if (parseInt(newValue) < 1) {
    event.preventDefault();
  }
}

numOfFloors.addEventListener("keypress", validateUserInput);
numOfLifts.addEventListener("keypress", validateUserInput);

submitButton.addEventListener("click", (e) => {
  e.preventDefault();
  const numberOfFloors = Number(numOfFloors.value);
  const numberOfLifts = Number(numOfLifts.value);
  if (!numberOfFloors || !numberOfLifts) {
    alert("Please enter values for both floors and lifts.");
    return;
  }
  createSimulation(numberOfLifts, numberOfFloors);
  form.style.display = "none";
});

const createSimulation = (liftCount, floorCount) => {
  createFloors(floorCount, liftCount);
  createLifts(liftCount);
};

let liftState = [];
let floors = [];
let pendingAction = [];

const createFloors = (floorCount, liftCount) => {
  const viewportWidth = window.innerWidth;

  const requiredWidth = 100 * liftCount + 80;

  for (let i = 0; i < floorCount; i++) {
    const floor = document.createElement("div");
    floor.classList.add("floor");
    floor.id = `floor${floorCount - i - 1}`;

    floor.style.width =
      viewportWidth > requiredWidth
        ? `${viewportWidth}px`
        : `${requiredWidth}px`;

    const upButton = document.createElement("button");
    upButton.innerText = "UP";
    upButton.id = `up${floorCount - i - 1}`;
    upButton.addEventListener("click", buttonClickHandler);

    const downButton = document.createElement("button");
    downButton.id = `dn${floorCount - i - 1}`;
    downButton.innerText = "DOWN";
    downButton.addEventListener("click", buttonClickHandler);

    const floorNumber = document.createElement("span");
    floorNumber.classList.add("floor-number");
    if (floorCount - i - 1 > 0)
      floorNumber.innerText = "Floor " + String(floorCount - i - 1);
    else floorNumber.innerText = "GROUND";

    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("buttons-box");

    if (floorCount === 1) {
      buttonsContainer.appendChild(upButton);
    }

    if (i > 0) buttonsContainer.appendChild(upButton);
    buttonsContainer.appendChild(floorNumber);
    if (i < floorCount - 1) buttonsContainer.appendChild(downButton);
    floor.appendChild(buttonsContainer);

    mainContent.appendChild(floor);

    floors.push(floor);
  }
};

const buttonClickHandler = (event) => {
  const floorNumberCalled = Number(event.target.id.substring(2));
  console.log("FLOOR NUMBER CALLED", floorNumberCalled, event.target.id);
  const buttonCaller = event.target.id.substring(0, 2) === "dn" ? "DOWN" : "UP";
  if (isLiftOnTheWayToFloor(liftState, floorNumberCalled, buttonCaller)) {
    return;
  }
  pendingAction.push([floorNumberCalled, buttonCaller]);
  console.log("PENDING ACTION", pendingAction);
};

const createLifts = (liftCount) => {
  for (let i = 0; i < liftCount; i++) {
    const floor0 = document.querySelector("#floor0");
    const lift = document.createElement("div");
    const leftDoor = document.createElement("div");
    const rightDoor = document.createElement("div");

    leftDoor.classList.add("door");
    rightDoor.classList.add("door");
    leftDoor.classList.add("left-door");
    rightDoor.classList.add("right-door");

    leftDoor.id = `left-door${i}`;
    rightDoor.id = `right-door${i}`;

    lift.appendChild(leftDoor);
    lift.appendChild(rightDoor);
    lift.classList.add("lift");

    lift.id = `lift${i}`;
    lift.style.left = `${100 + i * 100}px`;
    const currentLiftState = {
      id: i,
      currentFloor: 0,
      doorReopen: [],
      domElement: lift,
      isBusy: false,
      innerHtML: ``,
      isMoving: false,
      lastButtonCalled: null,
      goingTo: null,
    };
    floor0.appendChild(lift);
    liftState.push(currentLiftState);
  }

  setInterval(() => {
    scheduleLiftMovement();
  }, 100);
};

const isLiftOnTheWayToFloor = (liftState, destinationFloor, buttonCalled) => {
  const isLiftOnFloor = liftState.find(
    (lift) =>
      lift.isMoving === false &&
      lift.isBusy === true &&
      lift.currentFloor === destinationFloor
  );

  if (isLiftOnFloor != undefined) {
    const lift = isLiftOnFloor;
    const leftDoor = document.querySelector(`#left-door${lift.id}`);
    const rightDoor = document.querySelector(`#right-door${lift.id}`);
    openCloseDoors(lift, leftDoor, rightDoor);
    return true;
  }

  const isLiftComingToThatFloor = liftState.find(
    (lift) =>
      lift.isMoving === true &&
      lift.goingTo === destinationFloor &&
      lift.lastButtonCalled === buttonCalled
  );

  if (isLiftComingToThatFloor === undefined) {
    return false;
  }
  return true;
};

function openCloseDoors(lift, leftDoor, rightDoor) {
  lift.doorReopen.push(1);

  if (lift.currentDoorTimeout) {
    clearTimeout(lift.currentDoorTimeout);
    leftDoor.style.transition = "transform 2.5s linear";
    rightDoor.style.transition = "transform 2.5s linear";
    leftDoor.style.transform = "translateX(-100%)";
    rightDoor.style.transform = "translateX(100%)";
  } else {
    setTimeout(() => {
      leftDoor.style.transform = `translateX(-100%)`;
      leftDoor.style.transition = `transform 2.5s linear`;
      rightDoor.style.transform = `translateX(100%)`;
      rightDoor.style.transition = `transform 2.5s linear`;
    }, 0);
  }

  lift.isBusy = true;

  lift.currentDoorTimeout = setTimeout(() => {
    leftDoor.style.transform = `translateX(0)`;
    rightDoor.style.transform = `translateX(0)`;
  }, 2500);

  setTimeout(() => {
    lift.doorReopen.pop();
    if (lift.doorReopen.length === 0) {
      lift.isBusy = false;
      lift.currentDoorTimeout = null;
    }
  }, 5000);
}

function doorMovement(lift, dest, time, leftDoor, rightDoor) {
  setTimeout(() => {
    lift.isBusy = true;
    leftDoor.style.transform = `translateX(-100%)`;
    leftDoor.style.transition = `transform 2.5s linear`;
    rightDoor.style.transform = `translateX(100%)`;
    rightDoor.style.transition = `transform 2.5s linear`;
  }, time * 1000);

  setTimeout(() => {
    lift.isMoving = false;
    lift.currentFloor = dest;
    lift.goingTo = null;
  }, time * 1000 + 1);

  setTimeout(() => {
    leftDoor.style.transform = `translateX(0)`;
    leftDoor.style.transition = `transform 2.5s linear`;
    rightDoor.style.transform = `translateX(0)`;
    rightDoor.style.transition = `transform 2.5s linear`;
  }, time * 1000 + 2500);

  setTimeout(() => {
    if (lift.doorReopen.length === 0) lift.isBusy = false;
  }, time * 1000 + 5001);
}

const moveLiftFromSourceToDestination = (src, dest, buttonCalled, liftId) => {
  const lift = liftState.find((lift) => lift.id === liftId);

  let distance = -1 * dest * 120.8;
  if (window.innerWidth < 900) distance = -1 * dest * 100.8;
  const time = Math.abs(src - dest) * 2;
  const leftDoor = document.querySelector(`#left-door${liftId}`);
  const rightDoor = document.querySelector(`#right-door${liftId}`);

  doorMovement(lift, dest, time, leftDoor, rightDoor);

  lift.isMoving = true;
  lift.goingTo = dest;
  lift.lastButtonCalled = buttonCalled;
  lift.domElement.style.transform = `translateY(${distance}px)`;
  lift.domElement.style.transition = `transform ${time}s linear`;
};

const findClosestLift = (liftState, destinationFloor) => {
  let distance = floors.length;
  let liftId = null;
  for (let i = 0; i < liftState.length; i++) {
    const lift = liftState[i];
    if (
      Math.abs(lift.currentFloor - destinationFloor) < distance &&
      lift.isMoving === false &&
      lift.isBusy === false
    ) {
      distance = Math.abs(lift.currentFloor - destinationFloor);
      liftId = lift.id;
    }
  }
  return liftId;
};

const scheduleLiftMovement = () => {
  if (pendingAction.length === 0) return;
  const firstActionPending = pendingAction.shift();

  const floorCalled = firstActionPending[0];
  const buttonCalled = firstActionPending[1];
  const closestLiftId = findClosestLift(liftState, floorCalled);
  const closestLift = liftState.find((lift) => lift.id === closestLiftId);

  if (isLiftOnTheWayToFloor(liftState, floorCalled, buttonCalled)) {
    return;
  }

  if (closestLift === undefined || closestLift.isBusy) {
    pendingAction.unshift(firstActionPending);
    return;
  }

  moveLiftFromSourceToDestination(
    closestLift.currentFloor,
    floorCalled,
    buttonCalled,
    closestLiftId
  );
};
