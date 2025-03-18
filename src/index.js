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

// Основа для собаки.
class Dog extends Creature {
    constructor(name='Пес бандит', power=3) {
        super(name, power);
    }
}

class Gatling extends Creature {
    constructor() {
        super("Гатлинг", 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        for (const card of oppositePlayer.table) {
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                this.dealDamageToCreature(this.currentPower, card, gameContext, onDone);
            });
        }

        taskQueue.continueWith(continuation);
    }
}

class Trasher extends Dog {
    constructor() {
        super('Громила', 5);
        this.modifyTakenDamage = function (value, fromCard, gameContext, continuation) {
            this.view.signalAbility(() => continuation(value - 1));
        };

        this.getDescriptions = function () {
            const baseDescriptions = Card.prototype.getDescriptions.call(this);
            const abilityDescription = "Способность: Уменьшает урон на 1.";
            return [...baseDescriptions, abilityDescription];
        };
    }
}
class Lad extends Dog {
    constructor() {
        super('Браток', 2);

    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const count = this.getInGameCount();
        return count * (count + 1) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        continuation();
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(Math.max(value - Lad.getBonus(), 0));
    }

    getDescriptions() {
        const baseDescriptions = Card.prototype.getDescriptions.call(this);

        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') ||
            Lad.prototype.hasOwnProperty('modifyTakenDamage')) {
            baseDescriptions.push("Чем их больше, тем они сильнее");
        }

        return baseDescriptions;
    }
}

// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Gatling(),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Dog(),
    new Dog(),
    new Trasher(),
    new Lad(),
    new Lad(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
