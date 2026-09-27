// Algebra 1 — A Four-Week Course, adapted from the supplied course PDF.
// The short lectures, sample assignments, and answer key follow the uploaded course.
export type Lesson = [slug: string, title: string, blurb: string, body: string];

export const LESSONS: Lesson[] = [
  ["real-numbers-operations", "Real numbers and operations", "The number system algebra is built on.", `# Real numbers and operations

Algebra is arithmetic with letters standing in for numbers. The **real numbers** include natural numbers, integers (including zero and negatives), rationals (fractions $p/q$ with $q\\ne0$), and irrationals such as $\\sqrt{2}$ and $\\pi$.

**Signed numbers:** Absolute value $|a|$ is the distance from $a$ to zero, so $|-7|=7$. Adding a negative is subtracting; subtracting a negative is adding. A product of two negatives is positive; a product of a negative and a positive is negative. Division by zero is undefined.

**Opposites and reciprocals:** $a+(-a)=0$; for $a\\ne0$, $a(1/a)=1$. Subtraction adds an opposite and division multiplies by a reciprocal. These are the moves we use to solve equations.

**A real example:** In 628 CE Brahmagupta described positive numbers as fortunes and negatives as debts: the product of two debts is a fortune. European mathematicians still called negative solutions “absurd” a thousand years later.`],
  ["order-operations-expressions", "Order of operations and algebraic expressions", "Reading an expression the only way it can be read.", `# Order of operations and algebraic expressions

An algebraic expression combines numbers, variables, and operations, such as $3x+5$. To evaluate it, substitute a value for each variable and compute.

**Order of operations:** Do grouping first, then exponents, then multiplication and division left to right, then addition and subtraction left to right. For example, $3+4\\cdot2^2=3+4\\cdot4=19$.

**Translate carefully:** “Five less than twice a number” is $2n-5$, not $5-2n$. The square of a sum is $(x+y)^2$, while the sum of squares is $x^2+y^2$.

**A real example:** In 2019, $8\\div2(2+2)$ went viral because readers grouped it differently. It is a notation problem, not an arithmetic one: careful writing uses parentheses to show the intended grouping.`],
  ["properties-simplifying", "Properties and simplifying expressions", "Rewrite an expression without changing its value.", `# Properties and simplifying expressions

Equivalent expressions give the same value for every allowed variable value. The **commutative** property changes order ($a+b=b+a$, $ab=ba$); the **associative** property changes grouping; the identities are $a+0=a$ and $a\\cdot1=a$.

The distributive property is $a(b+c)=ab+ac$. Like terms have the same variables to the same powers. Combining them reverses distribution: $4x-7x=(4-7)x=-3x$. For example, $3(2x-5)-(x-4)=6x-15-x+4=5x-11$.

A minus before parentheses distributes $-1$ to **every** term inside.

**A real example:** Around 300 BCE, Euclid proved the distributive law geometrically by cutting a rectangle into strips. The area of each strip adds to the area of the whole rectangle.`],
  ["one-two-step-equations", "Solving one- and two-step equations", "Undo operations while keeping the balance.", `# Solving one- and two-step equations

An equation says two expressions are equal. A solution makes that statement true. To solve, produce equivalent equations until the variable stands alone.

**Properties of equality:** Whatever you do to one side, do to the other. From $a=b$, adding $c$ gives $a+c=b+c$; multiplying by $c$ gives $ac=bc$. Division requires a nonzero number.

Undo operations in reverse order. For $3x-7=11$, add $7$ to both sides: $3x=18$; divide by $3$: $x=6$. Check: $3(6)-7=11$.

**A real example:** The Egyptian Rhind Papyrus (about 1550 BCE) asks for a quantity whose sum with one-seventh of itself is $19$. In modern symbols $x+x/7=19$, so $x=16\\frac58$. The scribe used a scaled guess to find it.`],
  ["multi-step-equations", "Multi-step equations", "Variables on both sides, grouping, and fractions.", `# Multi-step equations

The plan is to simplify each side, collect variable terms on one side, then isolate the variable. Clear fractions with a common denominator, distribute and combine like terms, move variable terms and constants, then divide and check.

For example, $5x+3=2x-9$ becomes $3x=-12$, so $x=-4$.

If the variable cancels and a false statement remains, there is **no solution**: $2x+1=2x+5$ gives $1=5$. If a true statement remains, **every real number** is a solution: $2(x+3)=2x+6$ gives $6=6$.

**A real example:** A puzzle about Diophantus from around 500 CE expresses his life in fractions of $x$. Clearing denominators in $x=x/6+x/12+x/7+5+x/2+4$ gives $84x=75x+756$ and $x=84$.`],
  ["literal-equations-formulas", "Literal equations and formulas", "Solve for one letter in terms of the others.", `# Literal equations and formulas

A literal equation has several variables. Solve for one variable using the same operations as in a one-variable equation, treating the other letters as known quantities.

From distance $d=rt$, divide by nonzero $r$ to get $t=d/r$. From trapezoid area $A=\\frac12h(b_1+b_2)$, solve for height: $h=2A/(b_1+b_2)$. From $F=(9/5)C+32$, solve for Celsius: $C=(5/9)(F-32)$.

**Check units:** If distance is miles and rate is miles/hour, $d/r$ has units of hours. A wrong unit can reveal a wrong rearrangement.

**A real example:** In 1983 Air Canada Flight 143 ran out of fuel because the loading calculation used density in pounds per liter where kilograms per liter was needed. The captain glided the aircraft to Gimli.`],
  ["ratios-proportions-percent", "Ratios, proportions, and percent", "Compare quantities by division.", `# Ratios, proportions, and percent

A ratio compares by division, as $a:b$ or $a/b$. A rate compares quantities with different units. A proportion states that two ratios are equal.

Multiplying $a/b=c/d$ by $bd$ gives the **cross-product rule**, $ad=bc$ (with nonzero denominators). If 3 pounds cost $7.50, $3/7.50=8/x$ gives $3x=60$ and $x=20$ dollars.

Percent means “per hundred.” The percent equation is $\\text{part}=\\text{percent}\\times\\text{whole}$, and percent change is $(\\text{new}-\\text{old})/\\text{old}$. A 20% rise followed by a 20% fall leaves $1.2\\cdot0.8=0.96$ of the original.

**A real example:** Eratosthenes used a shadow angle of about $7.2^\\circ$ and a separation of 5,000 stadia to set up $7.2/360=5000/C$, estimating Earth’s circumference.`],

  ["linear-inequalities", "Linear inequalities", "Solve when the answer is a range.", `# Linear inequalities

An inequality compares expressions using $<$, $>$, $\\le$, or $\\ge$. Its solution is often a set of numbers. An open circle excludes an endpoint; a closed circle includes it.

Solve as you would an equation, **except** multiplying or dividing by a negative reverses the inequality. For example, $-3x>12$ becomes $x<-4$. Negation reflects the number line, so order reverses.

In interval notation, $x<-4$ is $(-\\infty,-4)$ and $x\\ge2$ is $[2,\\infty)$. “At least” means $\\ge$; “at most” means $\\le$.

**A real example:** Thomas Harriot first printed $<$ and $>$ in 1631. The $\\le$ and $\\ge$ signs came later from Pierre Bouguer.`],
  ["compound-absolute-value", "Compound and absolute-value statements", "Join conditions and measure distance from a target.", `# Compound and absolute-value statements

An **and** inequality requires both conditions, such as $-2<x\\le5$; an **or** inequality accepts either piece, such as $x<-1$ or $x>3$.

Absolute value is distance. The equation $|A|=k$ for $k>0$ splits into $A=k$ or $A=-k$. Thus $|2x-1|=7$ gives $x=4$ or $x=-3$; if $k<0$ there is no solution.

Distance **less** than $k$ gives an “and”: $|A|<k$ means $-k<A<k$. Distance **greater** than $k$ gives an “or”: $A<-k$ or $A>k$. Thus $|x-10|\\le3$ means $7\\le x\\le13$.

**A real example:** A shaft specified as $25.00\\pm0.05$ mm must satisfy $|d-25.00|\\le0.05$ so manufactured parts fit together.`],
  ["relations-functions", "Relations and functions", "Assign each input exactly one output.", `# Relations and functions

A relation is a set of input–output pairs. A **function** assigns exactly one output to each input. The input set is the **domain**; the output set is the **range**.

$f(x)$ means the output of function $f$ at input $x$, not $f$ times $x$. If $f(x)=2x^2-3$, then $f(4)=2(16)-3=29$. Tables, equations, graphs, and words can all describe functions.

A graph passes the **vertical line test** when each vertical line meets it at most once. A circle fails: $x^2+y^2=25$ has two outputs when $x=3$, namely $y=4$ and $y=-4$.

**A real example:** Leibniz introduced “function” in the 1690s, Euler popularized $f(x)$ in 1734, and Dirichlet later formalized the modern input–output definition.`],
  ["slope-rate-change", "Slope and rate of change", "Measure the steepness of a line.", `# Slope and rate of change

Slope is vertical change divided by horizontal change. Between $(x_1,y_1)$ and $(x_2,y_2)$, $m=(y_2-y_1)/(x_2-x_1)$, provided $x_2\\ne x_1$.

From $(1,2)$ to $(4,11)$, the rise is $9$ and the run is $3$, so $m=3$. Positive slope rises left to right; negative slope falls; a horizontal line has slope $0$ and a vertical line has undefined slope.

In an application, slope is a **rate of change** with units. A function has a constant rate of change precisely when its graph is a line.

**A real example:** An ADA wheelchair ramp with maximum slope $1/12$ needs at least 30 feet of horizontal run to climb 30 inches.`],
  ["slope-intercept-point-slope", "Slope-intercept and point-slope forms", "Write the equation of a line.", `# Slope-intercept and point-slope forms

Every nonvertical line has an equation. In **slope-intercept form**, $y=mx+b$, $m$ is its slope and $b$ is the $y$-intercept. For $y=-\\frac23x+4$, start at $(0,4)$ and move down 2, right 3.

**Point-slope form** uses slope $m$ and a point $(x_1,y_1)$: $y-y_1=m(x-x_1)$. Given two points, calculate the slope, then substitute either point.

In a linear model, the intercept is the starting value and slope is the rate. A $3 taxi fare plus $2.50 per mile is $y=2.5x+3$.

**A real example:** Water freezes at $(0^\\circ C,32^\\circ F)$ and boils at $(100^\\circ C,212^\\circ F)$. The slope is $1.8$, so $F=1.8C+32$, and both scales agree at $-40^\\circ$.`],
  ["standard-parallel-perpendicular", "Standard form, parallel and perpendicular lines", "See how lines relate.", `# Standard form, parallel and perpendicular lines

A line in **standard form** is $Ax+By=C$. For $3x+4y=12$, setting $y=0$ gives the $x$-intercept $(4,0)$; setting $x=0$ gives the $y$-intercept $(0,3)$.

Horizontal lines have $y=k$ and slope $0$. Vertical lines have $x=h$ and undefined slope; they are not functions of $x$.

Distinct nonvertical lines are **parallel** when $m_1=m_2$ and **perpendicular** when $m_1m_2=-1$. A line perpendicular to $y=2x+1$ through $(4,0)$ has slope $-1/2$ and equation $y=-\\frac12(x-4)$.

**A real example:** Descartes joined algebra and geometry in 1637 by describing points with coordinates, turning geometric questions about lines into equations about slopes.`],
  ["linear-models-scatter", "Linear models and scatter plots", "Fit a line to real, messy data.", `# Linear models and scatter plots

Real paired data seldom fall exactly on a line. A scatter plot displays the points, while a **line of best fit** summarizes a roughly linear trend.

The correlation coefficient $r$ ranges from $-1$ to $1$ and measures how tightly points follow a line. A least-squares line $\\hat y=mx+b$ minimizes the sum of squared vertical distances $\\sum(y-\\hat y)^2$.

Prediction inside observed data is **interpolation**; outside it is riskier **extrapolation**. Interpret slope and intercept in the units of the context. Correlation is not causation.

**A real example:** Edwin Hubble’s 1929 plot of galaxy speed against distance had scattered points but showed a linear trend, $v=H_0d$: galaxies farther away recede faster.`],

  ["systems-graphing", "Systems of equations by graphing", "Find where two lines meet.", `# Systems of equations by graphing

A solution to a system satisfies every equation at once. On a graph, it is the intersection of the lines. Different slopes meet once; parallel lines have no solution; identical lines have infinitely many.

For $y=2x-1$ and $y=-x+5$, set $2x-1=-x+5$ to find $x=2$ and $y=3$, so the solution is $(2,3)$.

Graphs show which case you have, but an intersection read from a sketch can be imprecise. Use algebra to compute an exact answer. Cost and revenue lines meet at break-even.

**A real example:** Navigators once drew two compass bearings as lines on a sea chart. Their intersection fixed the ship’s position; a third bearing checked the result.`],
  ["substitution-elimination", "Substitution and elimination", "Solve systems exactly.", `# Substitution and elimination

Both methods reduce two equations in two unknowns to one equation in one unknown.

**Substitution:** If $y=3x$ and $x+y=12$, substitute $3x$ for $y$: $4x=12$, so $(x,y)=(3,9)$. Use it when a variable is already isolated.

**Elimination:** Add or subtract equations so a variable cancels. From $2x+3y=12$ and $4x-3y=6$, add to get $6x=18$, then $x=3$ and $y=2$. If both variables cancel, $0=7$ means no solution and $0=0$ means infinitely many.

**A real example:** The Chinese *Nine Chapters on the Mathematical Art* used columns of counting rods to eliminate unknowns roughly 1,700 years before the method was credited to Gauss in Europe.`],
  ["systems-inequalities", "Systems of linear inequalities", "Find the overlap of regions in the plane.", `# Systems of linear inequalities

A linear inequality such as $y>2x-3$ describes a **half-plane**. Draw a dashed boundary for $<$ or $>$ and a solid one for $\\le$ or $\\ge$. Test a point off the boundary to choose the shaded side.

A system’s solution is the overlap of its half-planes, called the **feasible region**.

For a linear objective $P=ax+by$ over a bounded feasible polygon, a maximum or minimum occurs at a vertex. Evaluate $P$ at each corner to choose the best mix under the constraints.

**A real example:** George Stigler’s 1945 cheapest-diet problem turned nutrition requirements into linear inequalities. Dantzig’s 1947 simplex method found the optimum by moving among corners of the feasible region.`],
  ["laws-exponents", "Laws of exponents", "Count factors in repeated multiplication.", `# Laws of exponents

For positive whole-number $n$, $a^n$ means $a$ multiplied by itself $n$ times. Counting factors proves $a^m a^n=a^{m+n}$, $a^m/a^n=a^{m-n}$, and $(a^m)^n=a^{mn}$ when division is defined.

Also $(ab)^n=a^nb^n$ and $(a/b)^n=a^n/b^n$. Exponents distribute over products, **not sums**: $(a+b)^n\\ne a^n+b^n$ in general.

Keeping the quotient law true gives $a^0=1$ and $a^{-n}=1/a^n$ for $a\\ne0$. Thus $2^{-3}=1/8$, not $-8$.

**A real example:** In *The Sand Reckoner*, Archimedes built orders of magnitude large enough to count grains of sand in the universe, using the same rule that multiplication adds exponents.`],
  ["scientific-notation-exponentials", "Scientific notation and exponential functions", "Describe large numbers and repeated growth.", `# Scientific notation and exponential functions

Scientific notation writes a number $a\\times10^n$ with $1\\le a<10$. The speed of light is about $3.0\\times10^8$ m/s. Exponent laws make multiplication easy: $(2\\times10^3)(4\\times10^5)=8\\times10^8$.

A linear function adds a fixed amount each step. An **exponential function** multiplies by a fixed factor: $y=a\\cdot b^x$ with $b>0$ and $b\\ne1$. Here $a$ is the initial value; $b>1$ means growth, while $0<b<1$ means decay.

Growth of $r$ percent per period is $y=a(1+r)^t$; decay is $y=a(1-r)^t$. For example, $1000(1.05)^{10}\\approx1629$.

**A real example:** Moore’s law predicted transistor counts roughly doubling every two years for decades: a model of the form $y=a\\cdot2^{t/2}$.`],
  ["polynomial-operations", "Polynomials and their operations", "Add, subtract, and multiply algebraic expressions.", `# Polynomials and their operations

A **polynomial** is a sum of terms $ax^n$ with whole-number exponents. Its **degree** is its largest exponent. Degrees give names such as linear, quadratic, and cubic; term counts give monomial, binomial, and trinomial.

Add and subtract by combining like terms. When subtracting a polynomial, distribute the minus: $(5x^2+3x-1)-(2x^2-x+4)=3x^2+4x-5$.

Multiply every term of one polynomial by every term of the other. For binomials, $(x+3)(x-5)=x^2-5x+3x-15=x^2-2x-15$. This is distribution repeated, sometimes called FOIL. The degree of a product is the sum of the degrees.

**A real example:** In 1591, François Viète systematically used letters for known and unknown values, making it possible to express infinitely many problems with one polynomial.`],
  ["special-products", "Special products", "Recognize patterns that save work.", `# Special products

The square patterns are $(a+b)^2=a^2+2ab+b^2$ and $(a-b)^2=a^2-2ab+b^2$. Do not forget the middle term: $(a+b)^2$ is **not** generally $a^2+b^2$.

The **difference of squares** comes from canceling middle terms: $(a+b)(a-b)=a^2-b^2$. Thus $49\\cdot51=50^2-1=2499$.

Higher powers follow Pascal’s triangle. For example, $(a+b)^3=a^3+3a^2b+3ab^2+b^3$.

**A real example:** The triangle is named after Pascal (1654), but Yang Hui published it in China in 1261 and credited Jia Xian, who used it around 1050.`],

  ["factoring-gcf-grouping", "Factoring: GCF and grouping", "Run multiplication in reverse.", `# Factoring: GCF and grouping

To **factor** a polynomial is to write it as a product. Always look first for the greatest common factor—the largest number and highest variable power common to all terms:

$6x^3+9x^2-15x=3x(2x^2+3x-5)$.

With four terms, group pairs and factor each. For example, $x^3+2x^2+3x+6=x^2(x+2)+3(x+2)=(x^2+3)(x+2)$. Multiply the result back to check.

**A real example:** Euclid’s algorithm for the greatest common divisor was described around 300 BCE and is still used in modern encryption.`],
  ["factoring-trinomials", "Factoring trinomials", "Find binomials that multiply to a quadratic.", `# Factoring trinomials

For $x^2+bx+c$, find numbers $p,q$ with $pq=c$ and $p+q=b$. Then $x^2+bx+c=(x+p)(x+q)$. For $x^2-x-12$, the pair is $-4,3$, giving $(x-4)(x+3)$.

When $a\\ne1$ in $ax^2+bx+c$, find two numbers whose product is $ac$ and sum is $b$, split the middle term, then group. For $6x^2+11x+4$, the numbers are 3 and 8, and the factorization is $(3x+4)(2x+1)$.

Recognize special products backwards: $a^2-b^2=(a+b)(a-b)$ and $a^2\\pm2ab+b^2=(a\\pm b)^2$. A polynomial that cannot be factored over the integers is **prime** over the integers.

**A real example:** RSA encryption relies on the fact that multiplying very large primes is easy while finding those factors from the product can be extremely hard.`],
  ["quadratics-factoring", "Solving quadratics by factoring", "Use the zero-product property.", `# Solving quadratics by factoring

A quadratic equation has form $ax^2+bx+c=0$ with $a\\ne0$. Its solutions are **roots** or **zeros**.

The **zero-product property** is $ab=0\\Rightarrow a=0$ or $b=0$. First move everything to one side, factor, then solve each factor. For $x^2-x-12=0$, $(x-4)(x+3)=0$, so $x=4$ or $x=-3$.

This property works only when the product equals zero. Do not divide by a variable without checking whether zero is a solution; factoring keeps all solutions.

**A real example:** A Babylonian tablet from about 1800 BCE poses $x^2+x=3/4$. Its positive root is $1/2$; the negative root $-3/2$ was excluded because lengths could not be negative.`],
  ["graphing-quadratics", "Graphing quadratic functions", "Read a parabola’s vertex, axis, and intercepts.", `# Graphing quadratic functions

The graph of $f(x)=ax^2+bx+c$ is a **parabola**. It opens up when $a>0$ and down when $a<0$; larger $|a|$ makes it narrower.

Its axis of symmetry is $x=-b/(2a)$. For $f(x)=x^2-4x+1$, the axis is $x=2$ and the vertex is $(2,-3)$, its minimum. Vertex form $f(x)=a(x-h)^2+k$ shows $(h,k)$ directly.

The $y$-intercept is $c$; $x$-intercepts solve $f(x)=0$. A parabola can cross twice, touch once, or miss the $x$-axis.

**A real example:** Galileo showed that projectile paths are parabolas. A ball with $h(t)=-16t^2+48t+6$ peaks at $t=1.5$ seconds and $42$ feet.`],
  ["completing-square-formula", "Completing the square and the quadratic formula", "Solve every quadratic, even when factoring fails.", `# Completing the square and the quadratic formula

To **complete the square**, add the square of half the $x$-coefficient. From $x^2+6x=7$, add $9$ to both sides: $(x+3)^2=16$, so $x=1$ or $x=-7$. The same move converts standard form to vertex form.

Doing this to $ax^2+bx+c=0$ yields the **quadratic formula**:

$$x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}.$$

The **discriminant** $b^2-4ac$ is positive for two real solutions, zero for one, and negative for none.

**A real example:** Around 820 CE, al-Khwarizmi solved $x^2+10x=39$ by drawing a square with two attached rectangles, completing the missing corner, and finding $x=3$. His book *al-jabr* gave algebra its name.`],
  ["radicals-pythagorean", "Radicals and the Pythagorean theorem", "Work with roots and right triangles.", `# Radicals and the Pythagorean theorem

The **principal square root** $\\sqrt a$ (for $a\\ge0$) is the nonnegative number whose square is $a$. Factor out perfect squares: $\\sqrt{72}=\\sqrt{36}\\sqrt2=6\\sqrt2$. Combine only like radicals: $3\\sqrt5+4\\sqrt5=7\\sqrt5$. Never assume $\\sqrt{a+b}=\\sqrt a+\\sqrt b$.

In a right triangle with legs $a,b$ and hypotenuse $c$, the **Pythagorean theorem** is $a^2+b^2=c^2$. It leads to $d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$ for the distance between two points.

**A real example:** The Babylonian tablet YBC 7289 from about 1800 BCE records a value of $\\sqrt2$ accurate to about six decimal places—the diagonal of a unit square.`],
  ["rational-expressions", "Rational expressions", "Algebraic fractions and their restrictions.", `# Rational expressions

A rational expression is a quotient of polynomials, such as $(x+1)/(x^2-4)$. Its denominator cannot be zero: here $x=2$ and $x=-2$ are excluded.

Factor before canceling **common factors**, not common terms. For example, $(x^2-9)/(x^2+3x)=(x+3)(x-3)/[x(x+3)]=(x-3)/x$ for the original allowed values $x\\ne0,-3$.

Multiply and divide as with ordinary fractions; add or subtract over a common denominator. To solve a rational equation, clear fractions with a common denominator, then reject any solution excluded by the original equation.

**A real example:** A camera lens follows $1/f=1/d_o+1/d_i$. With $f=50$ mm and $d_o=2000$ mm, the image forms about $51.3$ mm behind the lens.`],
  ["capstone-synthesis", "Capstone synthesis", "Equals done to equals stay equal.", `# Capstone synthesis

Algebra replaces numbers with letters and solves for unknowns by changing an equation **without changing its solutions**. The central principle is $a=b\\Rightarrow f(a)=f(b)$ for operations that are defined for both sides.

Week 1 rewrote expressions and equations with equivalent steps. Week 2 turned equations into functions, graphs, and rates. Week 3 extended the same ideas to systems, exponents, and polynomials. Week 4 factored and solved quadratics, and used roots and rational expressions.

Algebra 2 builds on this foundation with higher-degree polynomials, complex numbers, logarithms, and more. Geometry, trigonometry, statistics, and calculus also rely on these skills.

**A real example:** Cardano published formulas for cubic and quartic equations in 1545. Abel later showed that no general formula in radicals solves every quintic; Galois explained which equations are solvable.`],
];

type Problem = { lesson: number; prompt: string; correctAnswer: string };
const p = (lesson: number, prompt: string, correctAnswer: string): Problem => ({ lesson, prompt, correctAnswer });

const homeworkOne = [
  p(2, "Write the distributive property for $a(b+c)$.", "a(b+c) = ab+ac"),
  p(1, "Evaluate $3+4\\cdot2^2$.", "19"),
  p(3, "Solve $3x-7=11$.", "x = 6"),
  p(4, "Solve $5x+3=2x-9$.", "x = -4"),
];
const homeworkTwo = [
  p(5, "Solve $d=rt$ for $t$.", "t = d/r"),
  p(5, "Solve $F=(9/5)C+32$ for $C$.", "C = (5/9)(F-32)"),
  p(6, "Write the cross-product rule for $a/b=c/d$.", "ad = bc"),
  p(6, "Solve $3/7.50=8/x$.", "x = 20"),
];
const midterm = [
  p(7, "Solve $-3x>12$.", "x < -4"),
  p(8, "Solve $|2x-1|=7$.", "x = 4 or x = -3"),
  p(8, "Rewrite $|A|<k$ as a compound inequality, for $k>0$.", "-k < A < k"),
  p(9, "Evaluate $f(4)$ for $f(x)=2x^2-3$.", "f(4) = 29"),
  p(10, "Write the slope formula through $(x_1,y_1)$ and $(x_2,y_2)$.", "m = (y₂-y₁)/(x₂-x₁)"),
  p(11, "Write the slope-intercept form of a line.", "y = mx+b"),
  p(11, "Write the point-slope form of a line through $(x_1,y_1)$.", "y-y₁ = m(x-x₁)"),
  p(12, "Write the condition on slopes $m_1$ and $m_2$ for perpendicular lines.", "m₁m₂ = -1"),
];
const final = [
  p(15, "Solve the system $2x+3y=12$, $4x-3y=6$.", "x = 3, y = 2"),
  p(17, "Write the product rule for exponents $a^m\\cdot a^n$.", "a^m · a^n = a^(m+n)"),
  p(17, "Write the definition of $a^{-n}$ for $a\\ne0$.", "a^(-n) = 1/a^n"),
  p(18, "Write the general exponential function with initial value $a$.", "y = a · b^x"),
  p(20, "Expand $(a+b)^2$.", "(a+b)^2 = a^2+2ab+b^2"),
  p(22, "Factor $a^2-b^2$.", "a^2-b^2 = (a+b)(a-b)"),
  p(23, "Write the zero-product property.", "ab = 0 ⇒ a = 0 or b = 0"),
  p(24, "Write the axis of symmetry of $y=ax^2+bx+c$.", "x = -b/(2a)"),
  p(25, "Write the quadratic formula.", "x = (-b ± √(b²-4ac))/(2a)"),
  p(26, "Write the Pythagorean theorem for legs $a,b$ and hypotenuse $c$.", "a²+b² = c²"),
];

export const ASSIGNMENTS = [
  { kind: "homework" as const, title: "Homework 1.1 — Expressions and equations", weekNumber: 1, isTimed: false, timeLimitMinutes: null, instructions: "Short-answer problems on expressions and linear equations. Write each answer as the key formula or value in symbols using the on-screen math keyboard (use the Algebra tab for exponents, fractions, and radicals).", problems: homeworkOne },
  { kind: "homework" as const, title: "Homework 1.2 — Formulas and proportions", weekNumber: 1, isTimed: false, timeLimitMinutes: null, instructions: "Use the math keyboard for fractions, exponents, and radicals.", problems: homeworkTwo },
  { kind: "midterm" as const, title: "Midterm — Weeks 1 & 2", weekNumber: 2, isTimed: true, timeLimitMinutes: 60, instructions: "Cumulative midterm on expressions, equations, inequalities, functions, and linear graphs. 60 minutes. Math keyboard available; pasting disabled.", problems: midterm },
  { kind: "final" as const, title: "Final Exam — Algebra 1", weekNumber: 4, isTimed: true, timeLimitMinutes: 90, instructions: "Cumulative final covering all four weeks. 90 minutes. Math keyboard available; pasting disabled.", problems: final },
];