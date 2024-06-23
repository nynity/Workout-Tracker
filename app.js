// WorkoutPlan class
class WorkoutPlan {
    constructor() {
        this.groups = [];
        this.sessions = [];
        this.load();
    }

    addGroup(name) {
        this.groups.push({
            id: Date.now().toString(),
            name: name,
            exercises: [],
            lastStartedDate: null
        });
        this.save();
    }

    addExercise(groupId, name, targetSets = 3, targetReps = 15) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.exercises.push({
                id: Date.now().toString(),
                name: name,
                targetSets: targetSets,
                targetReps: targetReps
            });
            this.save();
        }
    }

    startWorkout(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.lastStartedDate = new Date();
            const session = {
                id: Date.now().toString(),
                groupId: groupId,
                date: new Date(),
                sets: []
            };
            this.sessions.push(session);
            this.save();
            return session;
        }
    }

    addSet(sessionId, exerciseId, reps, bandColor, difficulty) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            session.sets.push({
                id: Date.now().toString(),
                exerciseId: exerciseId,
                reps: reps,
                bandColor: bandColor,
                difficulty: difficulty
            });
            this.save();
        }
    }

    save() {
        localStorage.setItem('workoutPlanner', JSON.stringify({
            groups: this.groups,
            sessions: this.sessions
        }));
    }

    load() {
        const data = JSON.parse(localStorage.getItem('workoutPlanner'));
        if (data) {
            this.groups = data.groups || [];
            this.sessions = data.sessions || [];
        }
    }
}

// Initialize the app
const workoutPlan = new WorkoutPlan();
let currentSession = null;

// DOM elements
const groupList = document.getElementById('groupList');
const addGroupForm = document.getElementById('addGroupForm');
const newGroupName = document.getElementById('newGroupName');
const currentWorkout = document.getElementById('currentWorkout');
const exerciseList = document.getElementById('exerciseList');
const recordSetForm = document.getElementById('recordSetForm');
const finishWorkoutBtn = document.getElementById('finishWorkoutBtn');

// Event listeners
addGroupForm.addEventListener('submit', addGroup);
recordSetForm.addEventListener('submit', recordSet);
finishWorkoutBtn.addEventListener('click', finishWorkout);

// Functions
function renderGroups() {
    groupList.innerHTML = '';
    workoutPlan.groups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.innerHTML = `
            <h3>${group.name}</h3>
            <button onclick="startWorkout('${group.id}')">Start Workout</button>
            <button onclick="addExercise('${group.id}')">Add Exercise</button>
        `;
        groupList.appendChild(groupElement);
    });
}

function addGroup(e) {
    e.preventDefault();
    const name = newGroupName.value.trim();
    if (name) {
        workoutPlan.addGroup(name);
        newGroupName.value = '';
        renderGroups();
    }
}

function addExercise(groupId) {
    const name = prompt('Enter exercise name:');
    if (name) {
        workoutPlan.addExercise(groupId, name);
        renderGroups();
    }
}

function startWorkout(groupId) {
    currentSession = workoutPlan.startWorkout(groupId);
    const group = workoutPlan.groups.find(g => g.id === groupId);
    currentWorkout.style.display = 'block';
    finishWorkoutBtn.style.display = 'block';
    renderExercises(group);
}

function renderExercises(group) {
    exerciseList.innerHTML = '';
    group.exercises.forEach(exercise => {
        const exerciseElement = document.createElement('div');
        exerciseElement.innerHTML = `
            <h4>${exercise.name}</h4>
            <p>Target: ${exercise.targetSets} sets, ${exercise.targetReps} reps</p>
        `;
        exerciseList.appendChild(exerciseElement);
    });
}

function recordSet(e) {
    e.preventDefault();
    if (currentSession) {
        const exerciseId = currentSession.sets.length; // Simplified for this example
        const reps = document.getElementById('reps').value;
        const bandColor = document.getElementById('bandColor').value;
        const difficulty = document.getElementById('difficulty').value;
        
        workoutPlan.addSet(currentSession.id, exerciseId, reps, bandColor, difficulty);
        alert('Set recorded!');
        recordSetForm.reset();
    }
}

function finishWorkout() {
    currentSession = null;
    currentWorkout.style.display = 'none';
    finishWorkoutBtn.style.display = 'none';
    alert('Workout finished!');
}

// Initial render
renderGroups();