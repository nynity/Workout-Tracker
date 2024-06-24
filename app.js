// ==========================================
// DATA
// ==========================================

let workoutData = {
    cardio: {
        name: "Cardio",
        exercises: [
            { name: "Running", sets: 3, reps: 15 },
            { name: "Cycling", sets: 3, reps: 15 },
            { name: "Swimming", sets: 3, reps: 15 }
        ]
    },
    strength: {
        name: "Strength",
        exercises: [
            { name: "Squats", sets: 3, reps: 15 },
            { name: "Bench Press", sets: 3, reps: 15 },
            { name: "Deadlifts", sets: 3, reps: 15 }
        ]
    },
    flexibility: {
        name: "Flexibility",
        exercises: [
            { name: "Yoga", sets: 3, reps: 15 },
            { name: "Stretching", sets: 3, reps: 15 },
            { name: "Pilates", sets: 3, reps: 15 }
        ]
    }
};

let workoutHistory = [];
let currentWorkout = null;
let isEditing = false;

const BAND_STRENGTH_ORDER = ['No Band', 'Green', 'Blue', 'Orange', 'Red', 'Purple'];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function getWorkoutRecommendations(group) {
    return workoutData[group].exercises.map(exercise => {
        const relevantWorkouts = workoutHistory
            .filter(workout => workout.group === group && workout.exercises[exercise.name])
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);

        if (relevantWorkouts.length === 0) {
            return {
                name: exercise.name,
                recommendation: "No previous data for this exercise. Start with your preferred band.",
                bandData: null,
                recommendedBand: null
            };
        }

        const recentSets = relevantWorkouts.flatMap(workout => workout.exercises[exercise.name]);

        // Count the occurrences of each band
        const bandCounts = recentSets.reduce((counts, set) => {
            counts[set.band] = (counts[set.band] || 0) + 1;
            return counts;
        }, {});

        // Get the two most common bands
        const sortedBands = Object.entries(bandCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([band]) => band);

        // Calculate average difficulty for each of the two most common bands
        const bandData = sortedBands.map(band => {
            const setsWithBand = recentSets.filter(set => set.band === band);
            const avgDifficulty = setsWithBand.reduce((sum, set) => sum + parseInt(set.difficulty), 0) / setsWithBand.length;
            return { band, avgDifficulty };
        });

        // Determine the recommended band
        let recommendedBand = bandData[0].band; // Default to the most common band
        if (bandData.length > 1) {
            if (bandData[0].avgDifficulty <= 4.5 && bandData[1].avgDifficulty <= 4.5) {
                // If both are <= 4.5, choose the one with higher difficulty
                recommendedBand = bandData[0].avgDifficulty >= bandData[1].avgDifficulty ? bandData[0].band : bandData[1].band;
            } else if (bandData[0].avgDifficulty > 4.5 && bandData[1].avgDifficulty <= 4.5) {
                // If the first is > 4.5 and the second is <= 4.5, choose the second
                recommendedBand = bandData[1].band;
            }
            // If both are > 4.5 or if the first is <= 4.5 and the second is > 4.5, stick with the most common (default)
        }

        // Generate recommendation message
        let recommendation;
        if (bandData.length === 1) {
            recommendation = `You've only used the ${bandData[0].band} band recently. Consider trying other bands to find the optimal challenge.`;
        } else {
            recommendation = `Based on your recent performance, the ${recommendedBand} band is recommended for optimal challenge.`;
        }

        return {
            name: exercise.name,
            recommendation,
            bandData,
            recommendedBand
        };
    });
}

function getLastThreeWorkoutsForExercise(group, exerciseName) {
    return workoutHistory
        .filter(workout => workout.group === group && workout.exercises[exerciseName])
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
}

function exportWorkoutHistory() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Group,Exercise,Set,Reps,Band,Difficulty\n";

    workoutHistory.forEach(workout => {
        const date = workout.date.toISOString().split('T')[0]; // YYYY-MM-DD format
        Object.entries(workout.exercises).forEach(([exerciseName, sets]) => {
            sets.forEach(set => {
                csvContent += `${date},${workout.group},${exerciseName},${set.setNumber},${set.reps},${set.band},${set.difficulty}\n`;
            });
        });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "workout_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function viewOverallHistory() {
    showHistory(); // Call the existing showHistory function without a group parameter
}

function addHistoryButtons() {
    const container = document.querySelector('.container');
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';

    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Workout History';
    exportButton.addEventListener('click', exportWorkoutHistory);

    const viewOverallHistoryButton = document.createElement('button');
    viewOverallHistoryButton.textContent = 'View Overall History';
    viewOverallHistoryButton.addEventListener('click', viewOverallHistory);

    buttonContainer.appendChild(exportButton);
    buttonContainer.appendChild(viewOverallHistoryButton);
    container.appendChild(buttonContainer);
}

// ==========================================
// WORKOUT GROUP FUNCTIONS
// ==========================================

function renderWorkoutGroups() {
    const workoutGroupsContainer = document.getElementById('workoutGroups');
    workoutGroupsContainer.innerHTML = '';
    
    Object.keys(workoutData).forEach(key => {
        const card = document.createElement('div');
        card.className = 'workout-card';
        card.setAttribute('data-group', key);
        card.innerHTML = `
            <span>${workoutData[key].name}</span>
            ${isEditing ? `
                <button class="editGroupBtn" data-group="${key}">Edit</button>
                <button class="deleteGroupBtn" data-group="${key}">Delete</button>
            ` : ''}
        `;
        card.addEventListener('click', (e) => {
            if (e.target.className !== 'editGroupBtn' && e.target.className !== 'deleteGroupBtn') {
                selectWorkoutGroup(key);
            }
        });
        workoutGroupsContainer.appendChild(card);
    });

    if (isEditing) {
        document.querySelectorAll('.editGroupBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const group = e.target.getAttribute('data-group');
                editWorkoutGroup(group);
            });
        });
        document.querySelectorAll('.deleteGroupBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const group = e.target.getAttribute('data-group');
                deleteWorkoutGroup(group);
            });
        });
    }
}

function toggleEditWorkoutGroups() {
    isEditing = !isEditing;
    const editBtn = document.getElementById('editGroupsBtn');
    editBtn.textContent = isEditing ? 'Save Changes' : 'Edit Groups';
    renderWorkoutGroups();
}

function addWorkoutGroup() {
    const newGroupName = prompt("Enter the name of the new workout group:");
    if (newGroupName && newGroupName.trim() !== "") {
        const newKey = newGroupName.toLowerCase().replace(/\s+/g, '_');
        workoutData[newKey] = {
            name: newGroupName.trim(),
            exercises: []
        };
        renderWorkoutGroups();
    }
}

function editWorkoutGroup(group) {
    const newName = prompt("Enter new name for the workout group:", workoutData[group].name);
    if (newName && newName.trim() !== "") {
        workoutData[group].name = newName.trim();
        renderWorkoutGroups();
    }
}

function deleteWorkoutGroup(group) {
    if (confirm(`Are you sure you want to delete the "${workoutData[group].name}" group?`)) {
        delete workoutData[group];
        renderWorkoutGroups();
    }
}

// ==========================================
// EXERCISE FUNCTIONS
// ==========================================

function selectWorkoutGroup(group) {
    if (isEditing) return;
    
    const workoutCard = document.querySelector(`.workout-card[data-group="${group}"]`);
    if (!workoutCard) {
        console.error(`No workout card found for group: ${group}`);
        return;
    }
    
    document.querySelectorAll('.workout-card').forEach(card => card.classList.remove('active'));
    workoutCard.classList.add('active');
    
    const workoutInfo = document.getElementById('workoutInfo');
    workoutInfo.innerHTML = `
        <h3>${workoutData[group].name} Exercises</h3>
        <div class="button-row">
            <button id="addExerciseBtn">Add Exercise</button>
            <button id="editExercisesBtn">Edit Exercises</button>
            <button id="startWorkoutBtn">Start Workout</button>
            <button id="historyBtn">History</button>
        </div>
        <div id="exerciseList"></div>
    `;
    
    document.getElementById('addExerciseBtn').addEventListener('click', () => addExercise(group));
    document.getElementById('editExercisesBtn').addEventListener('click', () => toggleEditExercises(group));
    document.getElementById('startWorkoutBtn').addEventListener('click', () => startWorkout(group));
    document.getElementById('historyBtn').addEventListener('click', () => showHistory(group));
    
    renderExercises(group);
}

function renderExercises(group) {
    const exerciseList = document.getElementById('exerciseList');
    exerciseList.innerHTML = '';
    
    workoutData[group].exercises.forEach((exercise, index) => {
        const exerciseItem = document.createElement('div');
        exerciseItem.className = 'exercise-item';
        exerciseItem.innerHTML = `
            <div class="exercise-item-info">
                <span>${exercise.name}</span>
                <span>Sets: ${exercise.sets}, Reps: ${exercise.reps}</span>
            </div>
            <div class="exercise-item-controls">
                ${isEditing ? `
                    <button class="editExerciseBtn" data-index="${index}">Edit</button>
                    <button class="deleteExerciseBtn" data-index="${index}">Delete</button>
                    <div class="adjust-container">
                        <button class="adjustBtn" data-index="${index}" data-action="decreaseSets">-</button>
                        <span>Sets: ${exercise.sets}</span>
                        <button class="adjustBtn" data-index="${index}" data-action="increaseSets">+</button>
                    </div>
                    <div class="adjust-container">
                        <button class="adjustBtn" data-index="${index}" data-action="decreaseReps">-</button>
                        <span>Reps: ${exercise.reps}</span>
                        <button class="adjustBtn" data-index="${index}" data-action="increaseReps">+</button>
                    </div>
                ` : ''}
            </div>
        `;
        exerciseList.appendChild(exerciseItem);
    });

    if (isEditing) {
        document.querySelectorAll('.editExerciseBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                editExercise(group, index);
            });
        });
        document.querySelectorAll('.deleteExerciseBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                deleteExercise(group, index);
            });
        });
        document.querySelectorAll('.adjustBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                const action = e.target.getAttribute('data-action');
                adjustExercise(group, index, action);
            });
        });
    }
}

function addExercise(group) {
    const newExerciseName = prompt("Enter the name of the new exercise:");
    if (newExerciseName && newExerciseName.trim() !== "") {
        workoutData[group].exercises.push({
            name: newExerciseName.trim(),
            sets: 3,
            reps: 15
        });
        renderExercises(group);
    }
}

function editExercise(group, index) {
    const newName = prompt("Edit exercise name:", workoutData[group].exercises[index].name);
    if (newName && newName.trim() !== "") {
        workoutData[group].exercises[index].name = newName.trim();
        renderExercises(group);
    }
}

function adjustExercise(group, index, action) {
    const exercise = workoutData[group].exercises[index];
    switch (action) {
        case 'increaseSets':
            exercise.sets++;
            break;
        case 'decreaseSets':
            if (exercise.sets > 1) exercise.sets--;
            break;
        case 'increaseReps':
            exercise.reps++;
            break;
        case 'decreaseReps':
            if (exercise.reps > 1) exercise.reps--;
            break;
    }
    renderExercises(group);
}

function toggleEditExercises(group) {
    isEditing = !isEditing;
    const editBtn = document.getElementById('editExercisesBtn');
    editBtn.textContent = isEditing ? 'Save Changes' : 'Edit Exercises';
    renderExercises(group);
}

function deleteExercise(group, index) {
    if (confirm(`Are you sure you want to delete "${workoutData[group].exercises[index]}"?`)) {
        workoutData[group].exercises.splice(index, 1);
        renderExercises(group);
    }
}

// ==========================================
// WORKOUT PERFORMANCE FUNCTIONS
// ==========================================

function startWorkout(group) {
    currentWorkout = {
        group: group,
        date: new Date(),
        exercises: {}
    };
    
    const recommendations = getWorkoutRecommendations(group);
    
    const workoutPerformance = document.getElementById('workoutInfo');
    workoutPerformance.innerHTML = `
        <h3>Current Workout: ${workoutData[group].name}</h3>
        <table id="setRecorder">
            <tr>
                <th>Exercise</th>
                <th>Reps</th>
                <th>Band</th>
                <th>Difficulty</th>
                <th>Action</th>
            </tr>
            <tr>
                <td>
                    <select id="exerciseSelect">
                        ${workoutData[group].exercises.map(exercise => 
                            `<option value="${exercise.name}">${exercise.name}</option>`
                        ).join('')}
                    </select>
                </td>
                <td>
                    <button onclick="adjustCounter('reps', -1)">-</button>
                    <span id="repsCounter">15</span>
                    <button onclick="adjustCounter('reps', 1)">+</button>
                </td>
                <td>
                    <select id="bandSelect">
                        ${BAND_STRENGTH_ORDER.map(color => `<option value="${color}">${color}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <button onclick="adjustCounter('difficulty', -1)">-</button>
                    <span id="difficultyCounter">3</span>
                    <button onclick="adjustCounter('difficulty', 1)">+</button>
                </td>
                <td>
                    <button id="recordSetBtn">Record Set</button>
                </td>
            </tr>
            <tr>
                <td colspan="5" id="recommendationRow"></td>
            </tr>
        </table>
        <div class="workout-columns">
            <div class="workout-column">
                <div class="column-header">Exercise History</div>
                <div id="exerciseHistory"></div>
            </div>
            <div class="workout-column recorded-sets">
                <div class="column-header">Recorded Sets (Current Workout)</div>
                <div id="setRecords"></div>
            </div>
        </div>
        <button id="finishWorkoutBtn">Finish Workout</button>
    `;
    
    document.getElementById('recordSetBtn').addEventListener('click', recordSet);
    document.getElementById('finishWorkoutBtn').addEventListener('click', finishWorkout);
    
    const exerciseSelect = document.getElementById('exerciseSelect');
    const bandSelect = document.getElementById('bandSelect');
    const recommendationRow = document.getElementById('recommendationRow');
    const exerciseHistory = document.getElementById('exerciseHistory');
    
    function updateRecommendationAndHistory() {
        const selectedExercise = exerciseSelect.value;
        const recommendation = recommendations.find(rec => rec.name === selectedExercise);
        if (recommendation) {
            let recHtml = `<strong>Recommendation:</strong> ${recommendation.recommendation}<br>`;
            if (recommendation.bandData) {
                recHtml += `<br>Recent band performance:`;
                recommendation.bandData.forEach(data => {
                    recHtml += `<br>${data.band} band: Avg difficulty ${data.avgDifficulty.toFixed(2)}`;
                });
            }
            recommendationRow.innerHTML = recHtml;
            
            if (recommendation.recommendedBand) {
                bandSelect.value = recommendation.recommendedBand;
            }
            
            // Display exercise history
            const lastThreeWorkouts = getLastThreeWorkoutsForExercise(group, selectedExercise);
            exerciseHistory.innerHTML = `
                <h4>Last ${lastThreeWorkouts.length} workout(s) for ${selectedExercise}:</h4>
                ${lastThreeWorkouts.map((workout, index) => `
                    <div>
                        <h5>Workout on ${workout.date.toLocaleDateString()}</h5>
                        <table>
                            <tr>
                                <th>Set</th>
                                <th>Reps</th>
                                <th>Band</th>
                                <th>Difficulty</th>
                            </tr>
                            ${workout.exercises[selectedExercise].map(set => `
                                <tr>
                                    <td>${set.setNumber}</td>
                                    <td>${set.reps}</td>
                                    <td>${set.band}</td>
                                    <td>${set.difficulty}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                `).join('')}
            `;
        } else {
            recommendationRow.innerHTML = 'No recommendation available for this exercise.';
            exerciseHistory.innerHTML = '';
        }
    }
    
    exerciseSelect.addEventListener('change', updateRecommendationAndHistory);
    updateRecommendationAndHistory(); // Set initial recommendation and history
}

function adjustCounter(type, change) {
    const counter = document.getElementById(`${type}Counter`);
    let value = parseInt(counter.textContent);
    if (type === 'reps') {
        value = Math.max(1, value + change);
    } else if (type === 'difficulty') {
        value = Math.max(1, Math.min(5, value + change));
    }
    counter.textContent = value;
}

function recordSet() {
    const exerciseName = document.getElementById('exerciseSelect').value;
    if (!currentWorkout.exercises[exerciseName]) {
        currentWorkout.exercises[exerciseName] = [];
    }
    
    const setNumber = currentWorkout.exercises[exerciseName].length + 1;
    const reps = document.getElementById('repsCounter').textContent;
    const band = document.getElementById('bandSelect').value;
    const difficulty = document.getElementById('difficultyCounter').textContent;
    
    currentWorkout.exercises[exerciseName].push({ setNumber, reps, band, difficulty });
    
    renderSetRecords();
}

function renderSetRecords() {
    const setRecords = document.getElementById('setRecords');
    setRecords.innerHTML = `
        <h4>Recorded Sets - ${currentWorkout.date.toLocaleString()}</h4>
        <table>
            <tr>
                <th>Exercise</th>
                <th>Set</th>
                <th>Reps</th>
                <th>Band</th>
                <th>Difficulty</th>
            </tr>
            ${Object.entries(currentWorkout.exercises).map(([exerciseName, sets]) => 
                sets.map((set, index) => `
                    <tr>
                        <td>${index === 0 ? exerciseName : ''}</td>
                        <td>${set.setNumber}</td>
                        <td>${set.reps}</td>
                        <td>${set.band}</td>
                        <td>${set.difficulty}</td>
                    </tr>
                `).join('')
            ).join('')}
        </table>
    `;
}

function finishWorkout() {
    workoutHistory.push(currentWorkout);
    currentWorkout = null;
    // Instead of showing an alert, directly go to the main page
    const firstGroup = Object.keys(workoutData)[0];
    selectWorkoutGroup(firstGroup);
}

function showHistory(group = null) {
    const workoutInfo = document.getElementById('workoutInfo');
    workoutInfo.innerHTML = `
        <h3>Workout History${group ? ` for ${workoutData[group].name}` : ' (All Workouts)'}</h3>
        <div id="historyList"></div>
        <button id="backBtn">Back to Workouts</button>
    `;
    
    const historyList = document.getElementById('historyList');
    const filteredHistory = group ? workoutHistory.filter(workout => workout.group === group) : workoutHistory;
    
    // Sort the history to show most recent first
    const sortedHistory = filteredHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    historyList.innerHTML = sortedHistory.map((workout, workoutIndex) => `
        <h4>Workout ${sortedHistory.length - workoutIndex}: ${workout.group} - ${workout.date.toLocaleString()}</h4>
        <table>
            <tr>
                <th>Exercise</th>
                <th>Set</th>
                <th>Reps</th>
                <th>Band</th>
                <th>Difficulty</th>
            </tr>
            ${Object.entries(workout.exercises).map(([exerciseName, sets]) => 
                sets.map((set, index) => `
                    <tr>
                        <td>${index === 0 ? exerciseName : ''}</td>
                        <td>${set.setNumber}</td>
                        <td>${set.reps}</td>
                        <td>${set.band}</td>
                        <td>${set.difficulty}</td>
                    </tr>
                `).join('')
            ).join('')}
        </table>
    `).join('');
    
    document.getElementById('backBtn').addEventListener('click', () => {
        const firstGroup = Object.keys(workoutData)[0];
        selectWorkoutGroup(firstGroup);
    });
}

function showRecentWorkouts(group) {
    const recentWorkouts = document.getElementById('recentWorkouts');
    const groupWorkouts = workoutHistory.filter(workout => workout.group === group).slice(-3).reverse();
    
    if (groupWorkouts.length === 0) {
        recentWorkouts.innerHTML = '<p>No recent workouts for this group.</p>';
        return;
    }

    recentWorkouts.innerHTML = groupWorkouts.map((workout, workoutIndex) => `
        <h5>Workout on ${workout.date.toLocaleString()}</h5>
        <table>
            <tr>
                <th>Exercise</th>
                <th>Set</th>
                <th>Reps</th>
                <th>Band</th>
                <th>Difficulty</th>
            </tr>
            ${Object.entries(workout.exercises).map(([exerciseName, sets]) => 
                sets.map((set, index) => `
                    <tr>
                        <td>${index === 0 ? exerciseName : ''}</td>
                        <td>${set.setNumber}</td>
                        <td>${set.reps}</td>
                        <td>${set.band}</td>
                        <td>${set.difficulty}</td>
                    </tr>
                `).join('')
            ).join('')}
        </table>
    `).join('');
}

// ==========================================
// INITIALIZATION
// ==========================================

function selectWorkoutGroup(group) {
    if (isEditing) return;
    
    const workoutCard = document.querySelector(`.workout-card[data-group="${group}"]`);
    if (!workoutCard) {
        console.error(`No workout card found for group: ${group}`);
        return;
    }
    
    document.querySelectorAll('.workout-card').forEach(card => card.classList.remove('active'));
    workoutCard.classList.add('active');
    
    const workoutInfo = document.getElementById('workoutInfo');
    workoutInfo.innerHTML = `
        <h3>${workoutData[group].name} Exercises</h3>
        <div id="exerciseList"></div>
        <button id="addExerciseBtn">Add Exercise</button>
        <button id="editExercisesBtn">Edit Exercises</button>
        <div id="workoutActions">
            <button id="startWorkoutBtn">START WORKOUT</button>
            <button id="historyBtn">HISTORY</button>
        </div>
    `;
    
    document.getElementById('addExerciseBtn').addEventListener('click', () => addExercise(group));
    document.getElementById('editExercisesBtn').addEventListener('click', () => toggleEditExercises(group));
    document.getElementById('startWorkoutBtn').addEventListener('click', () => startWorkout(group));
    document.getElementById('historyBtn').addEventListener('click', () => showHistory(group));
    
    renderExercises(group);
}

// Event Listeners
document.getElementById('editGroupsBtn').addEventListener('click', toggleEditWorkoutGroups);
document.getElementById('addGroupBtn').addEventListener('click', addWorkoutGroup);

// Initial render
renderWorkoutGroups();

function initializeApp() {
    renderWorkoutGroups();
    // Select the first workout group by default
    const firstGroup = Object.keys(workoutData)[0];
    if (firstGroup) {
        selectWorkoutGroup(firstGroup);
    }
    // Add the history buttons after initialization
    addHistoryButtons();
}

// Call the initialization function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);
