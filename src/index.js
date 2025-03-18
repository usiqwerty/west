import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';
import card from "./Card.js";

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card {
    constructor(name, power) {
        super(name, power);

    }

    getDescriptions(){
        return [getCreatureDescription(this), super.getDescriptions()]
    }
}

// Основа для утки.
class Duck extends Creature {
    constructor() {
        super('Мирная утка', 2);
    }
    quacks () { console.log('quack') };
    swims (){ console.log('float: both;') };
}

class Gatling extends Creature {
    constructor() {
        super('Гатлинг', 6);
    }
    attack(gameContext, continuation){
        const taskQueue = new TaskQueue();

        for (const oppositeCard of gameContext.oppositePlayer.table) {
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                if (oppositeCard) {
                    this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
                }
            });
        }
        taskQueue.continueWith(continuation);
    }
}
// Основа для собаки.
class Dog extends Creature {
    constructor() {
        super('Пес бандит', 3);
    }
}


class Trasher extends Dog {
    constructor() {
        super('Громила', 5);
    }

    modifyTakenDamage (value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {
            continuation(value - 1);
        })
    }

    getDescriptions () { return ["Если атакуют, урон уменьшается на 1"]; }
}

class Lad extends Dog {
    constructor() {
        super('Браток', 2);

    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    doAfterComingIntoPlay() {
        this.setInGameCount(this.inGameCount() + 1);
    }

    doBeforeRemoving() {

    }

    getDescriptions () { return ["Чем их больше, тем они сильнее"]; }
}

// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Gatling(),
    new Duck(),
    new Duck(),

];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Trasher(),
    new Dog(),
    new Dog(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
