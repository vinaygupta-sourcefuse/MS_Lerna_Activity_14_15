# MS_Lerna


cd services/


// that will run all lb4 repo at once
npx lerna run start

cd facades/book

// that will run book facade here
npm start 



create 3 diffrent DB for author

```create database author;
use author;
create table Author(
	author_id INT auto_increment primary key,
    author_name varchar(20),
    isbn int
); 
```
    
    
and 

```create database category;
use category;
create table Category(
	category_id INT auto_increment primary key,
    genre varchar(20),
    isbn int
);```

```create database book;
use book;```




for making it run again automatically 

```
npm install --save-dev nodemon concurrently
```

and  add this to package.json

```
"scripts": {
  "build": "lb-tsc",
  "start": "node -r source-map-support/register .",
  "dev": "npm run build && concurrently \"npm:watch\" \"npm:start:watch\"",
  "watch": "lb-tsc --watch",
  "start:watch": "nodemon --watch dist --ext js --exec \"node -r source-map-support/register .\""
}
 ```