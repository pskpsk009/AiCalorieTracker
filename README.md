# Get Fit Daily

GetFit — Mobile Fitness & Meal Tracking App

I want to build a mobile application called GetFit using React Native.

For now, focus on creating the frontend/UI and user experience. The app will eventually connect to a backend, authentication system, AI food recognition, and nutrition database, but these do not need to be fully implemented yet. Use realistic mock data where necessary.

1. Authentication

Create a simple Login / Register flow.

Login Screen

App name: GetFit

Email input

Password input

Login button

Link to Register

Clean, modern fitness-focused design

Register Screen

Name

Email

Password

Confirm Password

Register button

Link back to Login

After login, navigate to the main application.

2. Home Screen — Today's Meals

The main screen should focus on the user's daily calorie and nutrition intake.

At the top:

Today

Display a daily nutrition summary such as:

Total Calories

Protein

Carbohydrates

Fat

For example:

Today's Nutrition

1,450 / 2,000 kcal

Protein       85g
Carbs         160g
Fat            45g


Use a visual progress indicator for calories so the user can easily understand how much of their daily calorie target they have consumed.

Add Meal

Under the daily summary, include a prominent:

+ ADD MEAL

button.

When the user taps it, open the Add Meal screen.

3. Add Meal Screen

The purpose of this screen is to allow the user to add food by taking a picture.

Display:

Add Your Meal

A large camera/image area with:

📷 Take Picture

Also provide an option to:

Choose From Gallery

The user takes or selects a picture of their meal and submits it.

Button:

Analyze Meal

For the frontend prototype, simulate the AI analysis using mock data.

4. Meal Analysis / Result Screen

After the meal is analyzed, show the detected foods and their nutritional information.

Example:

Your Meal

🍚 White Rice
200g
260 kcal
Protein 5g | Carbs 57g | Fat 1g

🍗 Chicken Breast
150g
248 kcal
Protein 46g | Carbs 0g | Fat 5g

🥚 Fried Egg
50g
72 kcal
Protein 6g | Carbs 1g | Fat 5g

----------------------------

Total
580 kcal

Protein: 57g
Carbs: 58g
Fat: 11g


The user should be able to review the meal before saving it.

Include:

Save Meal

and optionally:

Edit Meal

The Edit option should allow the user to modify the detected food or portion size before saving.

5. Saving Meals

When the user presses Save Meal, add the meal to today's meal list.

The user should be able to add multiple meals throughout the day without a fixed limit.

For example:

Today's Meals

Breakfast
🥚 Eggs + Toast
420 kcal

Lunch
🍚 Chicken Rice
580 kcal

Snack
🍌 Banana + Yogurt
250 kcal

Dinner
🍝 Pasta
620 kcal


The Home screen should automatically update the daily:

Calories

Protein

Carbohydrates

Fat

For example:

Today's Calories

1,870 / 2,000 kcal
██████████████████░░

Protein     105g
Carbs       210g
Fat          58g


6. Statistics / Graph Screen

Create a second main screen called Progress or Statistics.

This screen should help users visually understand their calorie consumption over time.

Display a daily calorie graph.

For example:

Calories

2200 |             ●
2000 |       ●           ●
1800 |   ●       ●
1600 |
1400 |                     ●
     -------------------------
       Mon Tue Wed Thu Fri Sat


The graph should allow the user to compare:

Today

Yesterday

Previous days

The current week

Show the user's daily calorie intake clearly.

For example:

This Week

Mon    1,850 kcal
Tue    2,050 kcal
Wed    1,720 kcal
Thu    1,940 kcal
Fri    1,870 kcal
Sat    2,100 kcal
Sun    1,650 kcal


Also include a visual indicator showing the user's daily calorie target.

The purpose of this screen is to make it easy for the user to answer:

"Am I eating more or less than previous days?"

7. Navigation

Use a bottom tab navigation with two main sections:

🏠 Home

Today's meals, calories, protein, carbs, and fat.

📊 Progress

Daily and weekly calorie graphs and statistics.

The Add Meal screen should be accessible from the Home screen.

8. UI / Design

Create a modern, clean fitness application design.

Requirements:

Mobile-first design

Clean cards

Rounded corners

Clear typography

Easy-to-read nutrition numbers

Simple calorie progress indicator

Modern fitness/wellness appearance

Consistent spacing

Attractive but not overly complicated

Make the app feel like a real production mobile application

Use appropriate icons for:

Calories

Protein

Carbohydrates

Fat

Meals

Camera

Progress

The interface should be easy to understand for someone using the app every day.

9. Frontend Prototype Requirements

For this first version, focus on the frontend only.

Use mock data for:

Login

Meal analysis

Food names

Calories

Protein

Carbohydrates

Fat

Daily calorie history

Do not require a real AI food recognition API yet.

The frontend should be structured so that a backend can be connected later.

The future application flow will be:

Login
  ↓
Home
  ↓
Add Meal
  ↓
Take / Select Food Picture
  ↓
AI Food Recognition
  ↓
Nutrition Analysis
  ↓
Review / Edit Meal
  ↓
Save Meal
  ↓
Update Today's Calories
  ↓
Progress / Graphs


Build the UI with reusable components so that meal cards, nutrition cards, progress bars, and graphs can be reused when the backend is added later.


## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
