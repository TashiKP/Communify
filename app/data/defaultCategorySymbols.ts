// src/data/defaultCategorySymbols.ts

interface DefaultCategoryData {
    [key: string]: string[]; // Category name (lowercase) maps to array of keywords
  }
  
  export const defaultCategoryData: DefaultCategoryData = {
    food: ['apple', 'banana', 'bread', 'water', 'milk', 'juice', 'eat', 'hungry', 'more', 'finished', 'orange', 'pizza', 'cookie', 'cake', 'cheese'],
    drinks: ['water', 'milk', 'juice', 'drink', 'thirsty', 'cup', 'bottle', 'soda', 'tea', 'coffee'],
    people: ['mom', 'dad', 'teacher', 'friend', 'boy', 'girl', 'baby', 'me', 'you', 'doctor', 'police', 'man', 'woman'],
    animals: ['dog', 'cat', 'bird', 'fish', 'bear', 'lion', 'horse', 'cow', 'pig', 'duck', 'frog'],
    toys: ['ball', 'doll', 'car', 'blocks', 'puzzle', 'play', 'game', 'bike', 'train', 'plane'],
    places: ['home', 'school', 'park', 'store', 'playground', 'house', 'room', 'outside', 'library', 'hospital'],
    actions: ['eat', 'drink', 'play', 'go', 'stop', 'want', 'help', 'look', 'listen', 'sleep', 'run', 'walk', 'jump', 'read', 'write', 'open', 'close', 'give', 'take', 'wash'],
    feelings: ['happy', 'sad', 'angry', 'scared', 'surprised', 'tired', 'hurt', 'sick', 'excited', 'love'],
    clothing: ['shirt', 'pants', 'shoes', 'socks', 'hat', 'jacket', 'dress', 'get dressed'],
    'body parts': ['head', 'eyes', 'nose', 'mouth', 'ears', 'hands', 'feet', 'arms', 'legs', 'tummy'], // Use quotes for multi-word keys if needed, though lowercase single word is easier
    school: ['school', 'teacher', 'book', 'pencil', 'paper', 'read', 'write', 'learn', 'bus', 'backpack', 'desk', 'chair'],
    colors: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'color'],
    numbers: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'number', 'count'],
  };
  
 