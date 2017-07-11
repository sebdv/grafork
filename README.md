# Welcome to Grafork

**What is Grafork?**

Grafork is (growing into) a web-app that turns your browser into a powerful tool for graph manipulation. It's still on "brainstorming" state and so far is just a bunch of concept tests.

**What is a graph?**

Short story: relationship between data. 

Long story (from wikipedia): mathematical structures used to model pairwise relations between objects. A graph in this context is made up of vertices or nodes or points and edges or arcs or lines that connect them. A graph may be undirected, meaning that there is no distinction between the two vertices associated with each edge, or its edges may be directed from one vertex to another"

![](https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/6n-graf.svg/250px-6n-graf.svg.png)

**What problem does it solve?**

Today there's only one software to manipulate graphs: Gephi, and it is old and slow, hard to use, offline and not collaborative. Grafork is a next-gen approach to big data, bringing a stable onlmine software for small projects to big companies to rely on.

Feel free to discuss, ask, fork or request.

**Requirements:**
- NodeJS basics: node, npm, bower, forever (recommended)
- MongoDB 3

**Installation:**
```bash
#Download Grafork dependencies
npm install
bower install

#Create a test user
mongo
> db.users.insert({username: 'test', password: 'test', nombre: 'John Doe'})
```

**Launch**
```sh
LOCAL=1 DEV=1 node .
```

**Disclaimer:**

A lot of stuff is still in spanish.
