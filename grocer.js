const itemCategories = ['Food', 'House', 'Kids', 'Other']
const shoppingModes = ['Shop', 'Shelf', 'Recipes', 'Meal Plan', '⚙']
const foodTypes = ['meal', 'ingredient', 'drink', 'other']
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

let fbItems = []


function logger_log(txt) {
    if (!grocerDebug) {
        document.getElementById('logger').style.display = 'none'
    }
    else {
        document.getElementById('logger').style.display = 'table'

    }
    let logger = document.getElementById('logger')
    logger.innerText = logger.innerText + txt + '\n';
}

function log_items(snap) {

    let val = snap.val()
    console.log(val.items)
}



const testItems = [
    { id: 0, text: 'bread', amount: 1, spendTime: 1 },
    { id: 1, text: 'cheese', amount: 3, spendTime: 7 },
    { id: 2, text: 'eggs', amount: 12, spendTime: 14 }]


var firebaseConfig = {
    apiKey: "AIzaSyAO4bX5SK-9rkbm3LEUf6vwaisa49eSPgY",
    authDomain: "grocer-33733.firebaseapp.com",
    projectId: "grocer-33733",
    storageBucket: "grocer-33733.appspot.com",
    messagingSenderId: "21774019630",
    appId: "1:21774019630:web:89b6ce782e767ed6f903bf",
    measurementId: "G-3CL2HR6KNF",
    databaseURL: "https://grocer-33733-default-rtdb.firebaseio.com"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var db = firebase.database()
var refShared = db.ref('shared')
var refGrocer = db.ref('grocery-lists/0/')
let refItems = refGrocer.child('items')
let refRecipes = refGrocer.child('recipes')
let refMealPlan = refGrocer.child('mealplan')


let grocerDebug = false

//Firebase Authentication

//let ui = new firebaseui.auth.AuthUI(firebase.auth());
var provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.email')



const Grocer = {
    data() {
        return {
            title: 'Grocery list',
            items: fbItems,
            recipes: [],
            mealplan: [],
            categories: itemCategories,
            currentCategory: itemCategories[0],
            foodTypes: foodTypes,
            maxId: Math.max(...fbItems.map(i => i.id)),
            selectedItemId: -1,
            selectedRecipeId: -1,
            selectedMealDay: -1,
            modes: shoppingModes,
            currentMode: shoppingModes[0],
            daysOfWeek: daysOfWeek,
            userId: null,
            userEmail: null,
            settingDebug: grocerDebug,
            settings: {
                sharedIn: [],
                sharedOut: [],
                switchUserId:null,
            }

        }
    },
    created() {
        /*let vm = this
        refItems.on('value', v => this.update_items(v))
        refRecipes.on('value', v => this.update_recipes(v))
        refMealPlan.on('value', v => this.update_mealplan(v))*/
        this.start_initialize()

    },

    computed: {

        itemsSorted() {
            return this.items.sort((a, b) => { return a.text >= b.text })

        },
        allIngredients() {
            let ingr = this.items.filter(item => { return item.foodType == 'ingredient' })

            return ingr.sort((a, b) => { return a.text >= b.text })
        },
        allMeals() {
            let meals = this.items.filter(item => { return item.foodType == 'meal' })

            return meals.sort((a, b) => { return a.text >= b.text })
        }

    },

    methods:
    {
        start_initialize() {
            /*let user = firebase.auth().currentUser;
            console.log(user)
            
            if (user == null) {

                this.start_auth()
                this.currentMode = '⚙'

            }
            else {
                console.log(`Signed in user is ${this.userId}`)
                this.userId = user.uid;
                this.userEmail = user.email;

                this.start_db()

            }*/

            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    this.userId = user.uid;
                    this.userEmail = user.email;
                    console.log(`Signed in user is ${this.userId}`)

                    this.start_db()
                }
                else {
                    //this.start_auth()
                    this.userId = null
                    this.items = []
                    this.recipes = []
                    this.mealplan = []
                    this.currentMode = '⚙'

                }
            });

        },
        async start_db() {
            console.log(`Signed in user is ${this.userId} switching to ${this.settings.switchUserId}`)
            let dbUserId = null

            if (this.settings.switchUserId) {
                dbUserId= this.settings.switchUserId
            }
            else {
                dbUserId = this.userId

            }
            let userInDb = false
            await db.ref('grocery-lists').child(dbUserId)
                .orderByKey().limitToFirst(1).once('value', (res => {
                    if (res.exists()) {
                        console.log('user exists!')
                        userInDb = true
                    }
                }))

            if (userInDb) {
                console.log(`DB entry already exists, loading...`)
                refGrocer = db.ref('grocery-lists').child(dbUserId)
                refItems = refGrocer.child('items')
                refRecipes = refGrocer.child('recipes')
                refMealPlan = refGrocer.child('mealplan')
            }
            else {
                console.log(`DB entry does not exist, creating...`)
                let mp = {}
                daysOfWeek.forEach((day, index) => {
                    mp[index] = { 'day': day }
                });
                logger_log(mp)

                db.ref('grocery-lists/' + dbUserId).set({
                    items: '',
                    recipes: '',
                    mealplan: mp,
                    owner: this.userEmail
                })
                refGrocer = db.ref('grocery-lists/' + dbUserId)
                refItems = refGrocer.child('items')
                refRecipes = refGrocer.child('recipes')
                refMealPlan = refGrocer.child('mealplan')

            }
            let vm = this
            refItems.on('value', v => this.update_items(v))
            refRecipes.on('value', v => this.update_recipes(v))
            refMealPlan.on('value', v => this.update_mealplan(v))
            refShared.on('value', v => this.update_sharing(v))
        },
        set_user() {
            
            let user = firebase.auth().currentUser;
            this.userId = user.uid;
            this.userEmail = user.email;
                 
            console.log('SET USER ', this.userId, this.userEmail)
            logger_log(this.userId)
        },

        switch_user(newUserId) {
            this.settings.switchUserId = newUserId
            this.start_db()
        },

        sign_out() {
            firebase.auth().signOut()
        },
        async start_auth() {
            await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)

            await firebase.auth().signInWithPopup(provider)
            await this.set_user()
            this.start_db()
            /*.then((result) => {
                /** @type {firebase.auth.OAuthCredential} 
                var credential = result.credential;

                // This gives you a Google Access Token. You can use it to access the Google API.
                var token = credential.accessToken;
                // The signed-in user info.
                this.userId = firebase.auth().getUid();
                logger_log(this.userId)

               this.start_db()

                // ...
            }).catch((error) => {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // The email of the user's account used.
                var email = error.email;
                // The firebase.auth.AuthCredential type that was used.
                var credential = error.credential;
                // ...
            });*/

        },
        reset_shopping() {
            this.items.forEach(item => {
                if (item.shoppingStatus != null) {
                    this.update_item_attribute(item.id, 'shoppingStatus', null)
                }
            })
        },
        update_sharing(snap) {
            this.settings.sharedOut=[]
            this.settings.sharedIn=[]

            snap.forEach((s) => {
                if (s.key == this.userId) {
                    this.settings.sharedOut = s.val().split(' ')
                    console.log('sharingOut', this.settings.sharedOut)
                }
                v = s.val()
                console.log(v)
                if (v.includes(this.userEmail)) {
                    this.settings.sharedIn.push(s.key)
                }
            })


        },
        update_items(snap) {
            let val = snap.val()

            //snap.forEach((s) => console.log (s.key,s.val()))
            let fbItems = []
            snap.forEach((s) => {
                v = s.val()
                fbItems.push(Object.assign({ id: s.key }, val[s.key]))
            })
            if (this.settingDebug) {
                logger_log(JSON.stringify(fbItems))
            }

            this.items = fbItems
        },

        update_recipes(snap) {
            let val = snap.val()

            //snap.forEach((s) => console.log (s.key,s.val()))
            let fbRecipes = []
            snap.forEach((s) => {
                v = s.val()
                fbRecipes.push(Object.assign({ id: s.key }, val[s.key]))
            })
            if (this.settingDebug) {
                logger_log(JSON.stringify(fbRecipes))
            }
            this.recipes = fbRecipes
        },

        update_mealplan(snap) {
            let val = snap.val()

            //snap.forEach((s) => console.log (s.key,s.val()))
            let fbPlans = []
            snap.forEach((s) => {
                v = s.val()
                fbPlans.push(Object.assign({ id: s.key }, val[s.key]))
            })
            if (this.settingDebug) {
                logger_log(JSON.stringify(fbPlans))
            }
            this.mealplan = fbPlans
        },

        collect_plan_all() {
            let mealIds = []
            let recipeIds = []
            for (let i = 0; i < 7; i++) {
                if (this.mealplan[i].meals) {
                    let meals = Object.values(this.mealplan[i].meals)
                    meals.forEach(m => { mealIds.push(m.id) })
                }

                if (this.mealplan[i].recipes) {
                    let recipes = Object.values(this.mealplan[i].recipes)
                    recipes.forEach(r => { recipeIds.push(r.id) })
                }
            }
            logger_log('meals: ')
            logger_log(mealIds)
            logger_log('recipes: ')
            logger_log(recipeIds)

            recipeIds.forEach(id => this.collect_recipe(id))
            mealIds.forEach(ingrId => {
                let item = this.items.filter(i => { return (i.id === ingrId) })[0]
                if (item) {

                    if (item.amount <= 1) {
                        this.update_item_attribute(item.id, 'needed', item.needed + 1)
                    }
                }
            })
            //TODO

        },

        collect_recipe(recipeId) {
            logger_log(recipeId)
            let recipe = this.recipes.filter(r => { return r.id === recipeId })[0]
            if (recipe) {
                ingrs = Object.keys(recipe['ingredients'])
                logger_log('ingrs:')
                logger_log(ingrs)
                ingrs.forEach(ingrId => {
                    let item = this.items.filter(i => { return (i.id === ingrId) })[0]
                    if (item) {

                        if (item.amount <= 1) {
                            this.update_item_attribute(item.id, 'needed', item.needed + 1)
                        }
                    }
                })
            }
            else {
                logger_log(`Warning - recipe ${recipeId} not found`)
            }
        },
        remove_sharing(index) {
            this.settings.sharedOut.splice(index, 1)
            refShared.child(this.userId).set(this.settings.sharedOut.join(' '))
        },
        remove_recipe(recipeId) {

            for (let i = 0; i < 7; i++) {
                if (this.mealplan[i].recipes) {
                    let recipes = Object.values(this.mealplan[i].recipes)
                    recipes.forEach(r => {
                        if (r.id == recipeId) {
                            this.remove_plan_recipe(i, recipeId)

                        }
                    })
                }
            }
            refRecipes.child(recipeId).remove()
        },
        remove_plan_all() {
            for (let i = 0; i < 7; i++) {
                refMealPlan.child(i).child('meals').remove()
                refMealPlan.child(i).child('recipes').remove()
            }
        },
        add_plan_meal(planId, mealId) {
            refNewMeal = refMealPlan.child(planId).child('meals').push();
            refNewMeal.set({
                id: mealId
            });

        },

        add_plan_recipe(planId, recipeId) {
            refNewMeal = refMealPlan.child(planId).child('recipes').push();
            refNewMeal.set({
                id: recipeId
            });

        },

        add_item(attrs) {

            //check if an item with the same name already exists
            let exists = this.items.filter(item => {
                return (item.text == attrs.text)
            })
            if (exists.length > 0) {
                logger_log(`Not actioned - item ${attrs.text} already exists`)
            }
            else {
                refNewItem = refItems.push();
                refNewItem.set(attrs);
            }

        },

        add_sharing(newEmail) {
            this.settings.sharedOut.push(newEmail)
            refShared.child(this.userId).set(this.settings.sharedOut.join(' '))

        },

        remove_item(itemId) {
            let item = this.items.filter(i => { return i.id === itemId })[0]
            if (item) {
                if (item.foodType === 'ingredient') {
                    let recipeIds = []
                    this.recipes.forEach(r => {
                        if (Object.keys(r.ingredients).includes(itemId)) {
                            this.remove_recipe_ingredient(r.id, itemId)
                        }

                    })
                }

                refItems.child(itemId).remove()
            }
            else {

                logger_log(`Warning - item ${itemId} not found`)

            }
        },

        remove_plan_meal(planId, mealId) {


            refMealPlan.child(planId).child('meals').child(mealId).remove()

        },

        remove_recipe_ingredient(recipeId, ingredientId) {
            refRecipes.child(recipeId).child('ingredients').child(ingredientId).remove()
        },

        remove_plan_recipe(planId, recipeId) {
            refMealPlan.child(planId).child('recipes').child(recipeId).remove()

        },

        update_item_attribute(itemId, attr, value, createIfMissing = true) {

            refItems.child(itemId).child(attr).set(value).then(logger_log, logger_log)

        },

        add_recipe(attrs) {
            let exists = this.recipes.filter(recipe => {
                return (recipe.name == attrs.name)
            })
            if (exists.length > 0) {
                logger_log(`Not actioned - recipe ${attrs.name} already exists`)
            }
            else {
                refNewRecipe = refRecipes.push()
                refNewRecipe.set(attrs);
            }
        },

        add_ingredient(recipeId, ingredientId) {
            refRecipes.child(recipeId).child('ingredients').child(ingredientId).set(ingredientId)

        },
        set_debug(debugOption) {
            if ([true, false].includes(debugOption)) {
                grocerDebug = debugOption
                this.settingDebug = debugOption
            }
        }



    }
}



app = Vue.createApp(Grocer)


app.component('nav-categories', {
    data() { return { categories: this.$root.categories } },

    template:
        `<div  class = "nav-categories"> 
    <div v-for = "cat in categories" v-bind:cat="cat" style= "display: table-cell; text-align:center;" @click="switch_category(cat)"> {{cat}} </div>
     </div>`,
    methods: {
        switch_category(cat) {
            logger_log(this.$root.userId)
            logger_log(this.$root.currentCategory)
            if (this.$root.userId != null) {
                this.$root.currentCategory = cat;
            }

        }


    }
});

app.component('nav-modes', {
    data() { return { modes: this.$root.modes } },

    template:
        `<div  class = "nav-modes"> 
     <div v-for = "mode in modes" v-bind:mod="mode" style= "display: table-cell; text-align:center;" @click="switch_mode(mode)"> {{mode}} </div>
     </div>`,
    methods: {
        switch_mode(mod) {
            logger_log(this.$root.userId)

            if (this.$root.userId != null) {
                this.$root.currentMode = mod;
            }


            logger_log(this.$root.currentMode)
        }

    }
});

app.component('add-item-input', {
    data() {
        return {
            newItemName: '',
            newFoodType: ''
        }
    },

    template: `<div  class = "grocery-input-add-item"> 
    <input type="text"  v-model="this.newItemName" size="20">
    <select v-if="this.$root.currentCategory=='Food'" v-model="this.newFoodType" > <option v-for="ftype in this.$root.foodTypes" :value=ftype> {{ftype}} </option> </select>
    <div class="grocery-button-add-item" @click = "addItem"> 🛒 </div>
     </div>`,
    methods: {
        addItem() {
            if (this.newItemName.length > 0) {
                //this.$root.maxId++
                //console.log(this.$root.maxId)
                //this.$root.items.push({ id: this.$root.maxId, text: this.newItemName, amount: 0, spendTime: -1 })
                this.$root.add_item({
                    text: this.newItemName,
                    amount: 0,
                    spendTime: 0,
                    needed: 1,
                    category: this.$root.currentCategory,
                    foodType: this.newFoodType,
                    shoppingStatus: null,
                    modified: Date.now()
                })

            }
        }

    }
});


app.component('grocery-item', {
    data() {
        return {
            active: false,
            touchBegin: undefined,
            touchFinish: undefined
        }
    },
    props: ['item'],

    template: `<div class="grocery-item" v-show="this.$root.currentCategory==this.item.category" :class= "selected ? 'grocery-active' : ''" @touchstart="touchStart">
    {{ item.text }} 
    <span v-show="!selected" class="grocery-button-amount" @click = "reduceAmount"> - </span>  
    <span v-show="!selected" class="grocery-amount" > {{ item.amount }} </span>  
    <span v-show="!selected" class= "grocery-button-amount" @click = "increaseAmount"> + </span> 
    <span v-show="!selected"> 🎯 </span>
    <span v-show="!selected" class= "grocery-button-amount" @click = "reduceNeeded"> - </span>  
    <span v-show="!selected" class="grocery-amount" > {{ item.needed }} </span>  
    <span v-show="!selected" class= "grocery-button-amount" @click = "increaseNeeded"> + </span> 
    <select v-show="selected&food" v-model="this.item.foodType" @change="set_food_type()"> <option v-for="ftype in this.$root.foodTypes" :value=ftype> {{ftype}} </option> </select>
    <span v-show="selected" @click="deleteItem"> ❌ </span>
    </div>`,
    computed: {
        selected() {
            return (this.$root.selectedItemId == this.item.id)
        },
        food() { return (this.item.category == 'Food') }
    },
    methods: {
        set_food_type(fT) {
            this.$root.update_item_attribute(this.item.id, 'foodType', this.item.foodType)

        },

        touchStart(touchEvent) {
            if (touchEvent.changedTouches.length !== 1) { // We only care if one finger is used
                return;
            }
            this.touchBegin = Date.now();
            addEventListener('touchend', (touchEvent) => this.touchEnd(touchEvent, this.touchBegin), { once: true });
        },
        touchEnd(touchEvent, touchBegin) {
            if (touchEvent.changedTouches.length !== 1) { // We only care if one finger is used
                return;
            }
            this.touchFinish = Date.now()
            if (this.touchFinish - this.touchBegin > 500) {
                this.active = !this.active
                if (this.active) {
                    this.$root.selectedItemId = this.item.id
                }


            }
        },

        reduceAmount() {
            //console.log(this.item.amount)
            if (this.item.amount > 0) {
                this.$root.update_item_attribute(this.item.id, 'amount', this.item.amount - 1)
            }
            else { this.$root.update_item_attribute(this.item.id, 'amount', 0) }

        },
        increaseAmount() {
            if (this.item.amount >= 0) {
                this.$root.update_item_attribute(this.item.id, 'amount', this.item.amount + 1)
            }
            else { this.$root.update_item_attribute(this.item.id, 'amount', 1) }

        },
        reduceNeeded() {

            if (this.item.needed > 0) {
                this.$root.update_item_attribute(this.item.id, 'needed', this.item.needed - 1)
            }
            else { this.$root.update_item_attribute(this.item.id, 'needed', 0) }

        },
        increaseNeeded() {
            if (this.item.needed >= 0) {
                this.$root.update_item_attribute(this.item.id, 'needed', this.item.needed + 1)
            }
            else { this.$root.update_item_attribute(this.item.id, 'needed', 1) }

        },
        deleteItem() {
            let delId = this.item.id;
            //this.$root.items = this.$root.items.filter(i => i.id != delId);
            this.$root.remove_item(delId)
        }
    }



});

app.component('shopping-item', {
    data() {
        return {
            active: false,
            touchBegin: undefined,
            touchFinish: undefined
        }
    },
    props: ['item'],

    template: `<div class="grocery-item" v-if='this.item.needed>0'  :class= "currentClass">
    {{ item.text }} 
    🎯
    <span class="grocery-amount" > {{ item.needed }} </span>  
    
    <span @click="itemBought"> 👍 </span>
    <span @click="itemNotAvailable"> 👎 </span>
    <span @click="itemNotNeeded"> ❌ </span>
    </div>`,
    computed: {
        currentClass() {
            if (this.item.shoppingStatus == 'NOT_AVAILABLE') {
                return 'shopping-notavail'
            }
        }
    },
    methods: {


        itemBought() {
            //console.log(this.item.amount)
            let a = 0;

            if (this.item.amount > 0) { a = this.item.amount }
            this.$root.update_item_attribute(this.item.id, 'amount', a + this.item.needed)
            this.$root.update_item_attribute(this.item.id, 'needed', 0)


        },
        itemNotAvailable() {
            this.$root.update_item_attribute(this.item.id, 'shoppingStatus', 'NOT_AVAILABLE')

        },
        itemNotNeeded() {

            this.$root.update_item_attribute(this.item.id, 'needed', 0)

        },
        reduceNeeded() {

            if (this.item.needed > 0) {
                this.$root.update_item_attribute(this.item.id, 'needed', this.item.needed - 1)
            }
            else { this.$root.update_item_attribute(this.item.id, 'needed', 0) }

        },
        increaseNeeded() {
            if (this.item.needed >= 0) {
                this.$root.update_item_attribute(this.item.id, 'needed', this.item.needed + 1)
            }
            else { this.$root.update_item_attribute(this.item.id, 'needed', 1) }

        },

    }



});

app.component('shopping-category', {

    props: ['category'],
    computed: {
        items() {
            //console.log (this.category)
            let filtered = this.$root.items.filter(item => { return item.category == this.category })
            let sorted = filtered.sort((a, b) => {
                if (a.shoppingStatus == 'NOT_AVAILABLE' && a.shoppingStatus != b.shoppingStatus) {
                    return 1
                }

                if (b.shoppingStatus == 'NOT_AVAILABLE' && a.shoppingStatus != b.shoppingStatus) {
                    return -1
                }

                return a.text > b.text

            })
            //console.log(filtered)
            return sorted;
        }
    },

    template:
        `<div  class = "shopping-category">
       --- {{category}} ---
        <br> 
    <shopping-item v-for = "item in items" v-bind:item="item"> </shopping-item>
     </div>`,
    methods: {

    }
});

app.component('shop-reset', {

    template:
        `<div  class='upper-icons' @click="this.$root.reset_shopping"> 
        ↯
     </div>`

});

app.component('recipe-item', {
    props: ['recipe'],
    data() {
        return {
            newIngredient: null,
            touchBegin: null,
            touchEnd: null,
            selectedIngredient: null
        }
    },
    computed: {
        selected() {
            return (this.$root.selectedRecipeId == this.recipe.id)
        },
        hasIngredients() {
            return (this.recipe.ingredients.length > 0)
        },
        allIngredientsAvailable() {
            let result = true

            for (let ingr of Object.values(this.recipe.ingredients)) {
                logger_log(ingr)
                let item = this.$root.items.filter(i => {
                    return (i.id == ingr)
                })[0]
                if (item.amount < 1) {
                    result = false
                }
            }
            return result
        }

    },
    template:
        `<div class="recipe-item"  :class= "selected ? 'recipe-active' : ''" v-on:click="select_this_recipe">
        <span v-show="allIngredientsAvailable"> ✅ </span>
    {{ recipe.name }} 
    <span v-show="selected" @click="delete_recipe"> ❌ </span>
    <span v-show="selected" @click.stop="get_recipe"> 🛒 </span>
    <br>
    <div class="recipe-ingredient" v-show='selected' v-for = "ingr in recipe.ingredients" @click.stop="select_this_ingredient(ingr)"> 
    {{this.ingredient_name(ingr)}} 
    <span v-show="this.selectedIngredient===ingr"  @click.stop="delete_ingredient(ingr)"> ❌ </span></div>
    <select v-show="selected" v-model="this.newIngredient"> <option v-for="ingr in this.$root.allIngredients" :value="ingr.id"> {{ingr.text}} </option> </select>
    <span v-show="selected" @click="add_ingredient()"> ✙ </span>
    
    </div>`,
    methods: {
        get_recipe() {
            logger_log(this.$root.selectedRecipeId)
            logger_log(this.recipe.id)
            this.$root.collect_recipe(this.recipe.id)


        },
        select_this_recipe() {
            this.$root.selectedRecipeId = this.recipe.id
            this.selectedIngredient = null
        },
        select_this_ingredient(ingrId) {
            logger_log(ingrId)
            this.selectedIngredient = ingrId
            logger_log(this.selectedIngredient)
        },
        delete_recipe() {
            this.$root.remove_recipe(this.recipe.id)
        },
        delete_ingredient(ingrId) {
            logger_log(this.recipe.id)
            logger_log(ingrId)
            this.$root.remove_recipe_ingredient(this.recipe.id, ingrId)
        },
        add_ingredient() {
            console.log(this.newIngredient)
            if (this.newIngredient != null) {
                this.$root.add_ingredient(this.recipe.id, this.newIngredient)
            }
        },
        ingredient_name(ingr) {
            //console.log('ingr:', ingr)
            let item = this.$root.allIngredients.filter(item => {
                return item.id == ingr
            })
            //console.log('item:', item.length, item)
            if (item.length > 0) {
                return item[0].text
            }

        }

    }

});

app.component('add-recipe-input', {
    data() {
        return {
            newRecipeName: ''
        }
    },

    template: `<div  class = "grocery-input-add-recipe"> 
    <input type="text"  v-model="this.newRecipeName" size="20"> 
    <div class="grocery-button-add-item" @click = "add_recipe"> 📜 </div>
     </div>`,
    methods: {
        add_recipe() {
            if (this.newRecipeName.length > 0) {
                //this.$root.maxId++
                //console.log(this.$root.maxId)
                //this.$root.items.push({ id: this.$root.maxId, text: this.newItemName, amount: 0, spendTime: -1 })
                this.$root.add_recipe({
                    name: this.newRecipeName,
                    ingredients: '',
                    modified: Date.now()
                })

            }
        }

    }
});


app.component('meal-icons', {
    data() {
        return {
            help: false
        }
    },
    methods: {
        toggle_help() {
            this.help = !this.help
        }
    },
    template:
        `<div  class='upper-icons' @click="this.$root.collect_mealplan"> 
        <span @click="this.$root.remove_plan_all"> 🚫 </span>  
        <span @click="this.$root.collect_plan_all"> 🛒 </span>
        <span @click="toggle_help">❓</span>
        <div class="help" v-show="help"> <br> HELP </div>
     </div>`

});

app.component('meal-day', {

    props: ['planid'],
    data() {
        return {
            newMeal: null,
            newRecipe: null,
            selectedMealRecipe: null

        }

    },
    computed: {
        meals() {
            if (this.$root.mealplan[this.planid].meals) {
                return Object.values(this.$root.mealplan[this.planid].meals)
            }
            else {
                return null
            }
        },
        recipes() {
            if (this.$root.mealplan[this.planid].recipes) {
                return Object.values(this.$root.mealplan[this.planid].recipes)
            }
            else {
                return null
            }
        },

        selectedDay() {
            return (this.planid == this.$root.selectedMealDay)
        }

    },

    template:
        `<div  class = "shopping-category" @click="select_this_day">
       --- {{this.$root.mealplan[this.planid].day}} ---
        <br> 
     <div class="plan-meal" v-for = "(meal, index) in this.meals" @click = "select_this_meal_recipe(meal.id)"> {{this.meal_name(meal)}} 
        <span v-show = "selectedDay & selected_item(meal.id)" @click="delete_meal(index)"> ❌</span> 
    </div>
     <div class="plan-meal" v-for = "(rec,index) in this.recipes" @click = "select_this_meal_recipe(rec.id)">  {{this.recipe_name(rec)}} 
        <span v-show = "selectedDay & selected_item(rec.id)" @click="delete_recipe(index)"> ❌</span> 
     </div>
   
    <div v-show="selectedDay"> Add meal <select  v-model="this.newMeal"> <option v-for="meal in this.$root.allMeals" :value="meal.id"> {{meal.text}} </option> </select>
    <span  @click="add_meal()"> ✙ </span> or recipe

    <select  v-model="this.newRecipe"> <option v-for="recipe in this.$root.recipes" :value="recipe.id"> {{recipe.name}} </option> </select>
    <span  @click="add_recipe()"> ✙ </span>
    </div>
     </div>`,
    methods: {
        select_this_day() {
            this.$root.selectedMealDay = this.planid

        },

        select_this_meal_recipe(id) {
            this.selectedMealRecipe = id

        },

        selected_item(id) {
            return (id == this.selectedMealRecipe)
        },

        add_meal() {
            if (this.newMeal) {
                //this.$root.maxId++
                //console.log(this.$root.maxId)
                //this.$root.items.push({ id: this.$root.maxId, text: this.newItemName, amount: 0, spendTime: -1 })
                this.$root.add_plan_meal(this.planid, this.newMeal)

            }
        },

        delete_meal(mealInd) {
            let delId = Object.keys(this.$root.mealplan[this.planid].meals)[mealInd]
            console.log(delId)
            this.$root.remove_plan_meal(this.planid, delId)
        },

        delete_recipe(recipeInd) {
            let delId = Object.keys(this.$root.mealplan[this.planid].recipes)[recipeInd]
            console.log(delId)
            this.$root.remove_plan_recipe(this.planid, delId)
        },

        add_recipe() {
            if (this.newRecipe) {
                //this.$root.maxId++
                //console.log(this.$root.maxId)
                //this.$root.items.push({ id: this.$root.maxId, text: this.newItemName, amount: 0, spendTime: -1 })
                this.$root.add_plan_recipe(this.planid, this.newRecipe)

            }
        },

        meal_name(meal) {
            //console.log('meal:', meal)
            let item = this.$root.allMeals.filter(item => {
                return item.id == meal.id
            })
            //console.log('item:', item.length, item)
            if (item.length > 0) {
                return item[0].text
            }

        },

        recipe_name(recipe) {
            //console.log('meal:', meal)
            let item = this.$root.recipes.filter(item => {
                return item.id == recipe.id
            })
            //console.log('item:', item.length, item)
            if (item.length > 0) {
                return item[0].name
            }

        }

    }
});

app.component('firebase-authenticator', {
    data() {
        return {
            help: false,
            settingDebug: this.$root.settingDebug,
            sharedOutSelected: null,
            sharedOutNewEmail: null,
            sharedUserId:this.$root.settings.switchUserId
        }
    },

    methods: {
        toggle_help() {
            this.help = !this.help
        },
        setting_debug() {
            if ([true, false].includes(this.settingDebug)) {
                this.$root.set_debug(this.settingDebug)
            }
        },
        select_sharing(index) {
            this.sharedOutSelected = index
        },
        add_sharing() {

            if (typeof this.sharedOutNewEmail == String) {
                if (this.sharedOutNewEmail.includes("@")) {
                    this.$root.add_sharing(this.sharedOutNewEmail)
                }
            }
        },

        delete_sharing() {
            if (this.sharedOutSelected > 0) {
                this.$root.remove_sharing(this.sharedOutSelected)
            }
        },
        switch_user(){
            if (this.sharedUserId!=this.$root.settings.switchUserId & this.sharedUserId!=null) {
                this.$root.switch_user(this.sharedUserId)
            }
        }
    },
    template:
        `<div  id="settings">

       <div class="settings-item" v-if="this.$root.userId==null" @click ="this.$root.start_auth()"> Sign in with Google </div>
      
       <div class="settings-item" v-if="this.$root.userId!=null" > Debug mode:
        <select v-if="this.$root.userId!=null" v-model="this.settingDebug"  @change="setting_debug"> 
            <option v-for="dO in [true,false]" :value="dO"> {{dO}} </option> 
        </select>
       </div>
       <div class="settings-item" v-if="this.$root.userId!=null" > Switch to shared list:
       <select v-if="this.$root.userId!=null" v-model=this.sharedUserId @change="switch_user"> 
       <option v-for="s in this.$root.settings.sharedIn" :value="s"> {{s}} </option> 
   </select>
       </div>

       <div class="settings-item" v-if="this.$root.userId!=null" > Sharing my list with (emails):
        <div class="plan-meal" v-for = "(em, index) in this.$root.settings.sharedOut" @click = "select_sharing(index)">  {{em}} 
            <span v-show = "index == this.sharedOutSelected" @click="delete_sharing()"> ❌</span> 
        </div>
        <input type="text" size=20 v-model="this.sharedOutNewEmail"> <span  @click="add_shared_email()"> ✙ </span>
       </div>
       <div class="settings-item" v-if="this.$root.userId!=null" @click ="this.$root.sign_out()"> Sign out </div>
        
     </div>`

});



app.mount('#main')
