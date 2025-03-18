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
    constructor(name='Пес бандит', power=3) {
        super(name, power);
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

    getDescriptions () {
        return ["Если атакуют, урон уменьшается на 1"];
    }
}

class Lad extends Dog {
    constructor() {
        super('Браток', 2);
    }
    static inGameCount = 0;

    static getInGameCount() {
        return this.inGameCount;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.inGameCount + 1);
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        continuation();
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.inGameCount - 1);
        continuation();
    }

    static getBonus() {
        return this.getInGameCount() * (this.getInGameCount() - 1) / 2;
    }

    modifyDealedDamageToCreature (value, toCard, gameContext, continuation) {
        console.log('нанёс', value + Lad.getBonus(), Lad.getInGameCount());
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        console.log('получил', value - Lad.getBonus(), Lad.getInGameCount());
        continuation((value - Lad.getBonus()) || 0)
    }

    getDescriptions () {
        return ["Чем их больше, тем они сильнее"];
    }
}

// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Gatling(),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Dog(),
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
