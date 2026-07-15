# 2D Particle Physics Simulator
  A simple 2D physics simulation built with HTML5 Canvas and vanilla JavaScript, no frameworks, no libraries, no build tools.
  
## What it does
- Simulates a bunch of particles (you can control how many) under gravity
- Particles bounce off the floor and walls, losing a bit of energy each time (restitution)
- Particles collide with each other and bounce apart realistically — using actual mass-weighted, normal-direction collision response instead of just swapping velocities
- Particles come in different sizes, and bigger ones push smaller ones around more (mass is derived from radius)
- You can drag particles around with your mouse and throw them, and tweak gravity, bounciness, and particle count with sliders while it's running

## Why I built this
I'm interested in computational physics and simulation (fluid/solid dynamics, graphics) and wanted to learn the fundamentals gravity, collision detection, and basic vector math by building something from scratch instead of just reading theory.

## How to run it
Just open `sim.html` in any browser. No installation needed.

## Project Structure
I split this into three files instead of keeping it all in one:
sim.html   — structure
style.css  — styling
sim.js     — all the actual physics/simulation logic

## What I learned
- The core simulation loop (update → draw → repeat)
- Position, velocity, and acceleration as the basis of motion
- Collision detection (circle-circle distance checks) and proper collision response — resolving velocity along the collision normal instead of just swapping vectors,     which is what actually makes glancing hits look right instead of just head-on ones
- Basic vector math (angle, distance, direction, normals, tangents) using Math.atan2 and Pythagorean distance
- How mass affects a collision, and a simple way to fake "mass" in 2D using particle area
  
## Next steps
- Spring-based cloth/soft-body simulation — planning to build this as its own separate project rather than adding it here, since it's a genuinely different simulation    model (particles connected by springs pulling toward a rest length, vs. rigid particles that only interact on contact)
- Basic fluid simulation
- Some kind of spatial partitioning (grid/quadtree) so collision checks don't fall over once there are a lot more particles, right now it's checking every pair, which    is fine for now but won't scale forever.
