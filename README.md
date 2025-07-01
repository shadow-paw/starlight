# StarLight
> Planetary Motion Simulator

## Demo
https://shadow-paw.github.io/starlight/

- `SPACE` to pause / unpause.
- `r` to restart simulation.

## Topology
### Normal
Space goes on forever (still limited by computer viewport and precision).
### Torus
Space are like [torus](https://en.wikipedia.org/wiki/Torus) but still flat, if you go on one direction you end up at where you started. To simplify calculation, force only act on the shortest path, but not both ways around.

## Gravity Laws
### Newton
This is the law we learnt in school. $a = GM/r²$.

### Modified Newtonian Dynamics
The acceleration drop off below a threshold $a₀$, with the function $μ(a/a₀) * a = GM/r²$.
- For $a \geq a₀$, $μ(a/a₀) = 1$, we call this Newton regime
- For $a \lt a₀$, $μ(a/a₀) = a/a₀$, we call this Modified regime

In Newton regime the equation reduce to the simple Newton gravity $a = GM/r²$, but when $a$ fall to the modified regime, it drop off by the factor $a/a₀$.
```
μ(a/a₀) * a = GM/r²
   a/a₀ * a = GM/r²
          a = sqrt(GMa₀)/r
```
It become a linear function with distance rather than an inverse square law.
