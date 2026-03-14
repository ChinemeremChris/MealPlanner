import styles from '../styles/meal-plan.module.css'
import { MealModal } from '../components/addMealModal'
import { MealCard } from '../components/mealCard'
import { UnsavedChangesModal } from '../components/unsavedChangesModal'
import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { Toast } from '../components/Toast'
import { SideBarHeading } from '../components/sideBarHeading'

export const Mealpage = () => {
    const [addMeal, setAddMeal] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [mealPlan, setMealPlan] = useState({})
    const [savedMealPlan, setSavedMealPlan] = useState({})
    const [weekStart, setWeekStart] = useState(new Date())
    const [pendingDate, setPendingDate] = useState(null)
    const [unsavedChanges, setUnsavedChanges] = useState(false) //set to false later
    const [notification, setNotification] = useState(null)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const mealType = ['breakfast', 'lunch', 'dinner']

    const blocker = useBlocker(({ currentLocation, nextLocation }) => hasChanges() && currentLocation.pathname !== nextLocation.pathname)

    const hasChanges = () => {
        const currentKeys = Object.keys(mealPlan)
        const savedKeys = Object.keys(savedMealPlan)

        if (currentKeys.length !== savedKeys.length){
            return true
        }

        for(const key of currentKeys){
            if(!savedMealPlan[key]){
                return true
            }
            if(savedMealPlan[key].recipe_id !== mealPlan[key].recipe_id){
                return true
            }
        }
        return false
    }


    const openModal = (date, timeOfDay) => {
        setAddMeal(true)
        setSelectedSlot({ date, timeOfDay })
    }

    const deleteMeal = (date, timeOfDay) => {
        setMealPlan(prev => {
            const { [`${date}-${timeOfDay}`]: removed, ...rest } = prev
            return rest
        })
    }

    const getWeekRange = (date) => {
        const start = new Date(date)
        start.setDate(start.getDate() - start.getDay())
        const end = new Date(start)
        end.setDate(end.getDate() + 6)

        const options = {month: "short", day: "numeric", year: "numeric"}
        return `${start.toLocaleDateString('en-us', options)} - ${end.toLocaleDateString('en-us', options)}`
    }

    const getWeekDates = (start) => {
        const sunday = new Date(start)
        sunday.setDate(sunday.getDate() - sunday.getDay())

        let weekDates = []
        let currentDate
        for(let i = 0; i < 7; i++){
            currentDate = new Date(sunday)
            currentDate.setDate(currentDate.getDate()+i)
            weekDates.push(currentDate)
        }
        return weekDates
    }

    const formatDateKey = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const getWeekStartEnd = (date) => {
        let start = new Date(date)
        start.setDate(start.getDate() - start.getDay())
        let end = new Date(start)
        end.setDate(start.getDate() + 6)
        start = formatDateKey(start)
        end = formatDateKey(end)
        return [start, end]
    }

    const splitDateType = (input) => {
        const lastDash = input.lastIndexOf('-')
        const date = input.substring(0, lastDash)
        const mealType = input.substring(lastDash+1)
        return [date, mealType]
    }

    const handleDateChange = (date) => {
        if (hasChanges()){
            setPendingDate(date)
            setUnsavedChanges(true)
        }else{
            setWeekStart(date)
        }
    }

    const handleSave = async () => {
        const mealArray = Object.entries(mealPlan).map(([key, recipe]) => {
            const [date, mealType] = splitDateType(key)
            return {
                recipe_id: recipe.recipe_id,
                meal_date: date,
                meal_type: mealType
            }
        })
        const [start, end] = getWeekStartEnd(weekStart)
        try{
            const response = await fetch(`${import.meta.env.VITE_API_URL}/batch/meals?start=${start}&end=${end}`,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(mealArray),
                credentials: "include"
            })
            
            if (!response.ok){
                throw new Error("Error saving plan")
            }
            setSavedMealPlan(mealPlan)
            setNotification({message: "Meal Plan saved successfully", type:"success"})
        }catch (e){
            setNotification({message: e.message || "Save unsuccessful", type: "error"})
        }finally{
            console.log("finally")
        }
    }

    const handleDiscardAndLeave = () => {
        if (pendingDate){
            setWeekStart(pendingDate)
            setPendingDate(null)
        }
        if (blocker.state === "blocked"){
            blocker.proceed()
        }
        setUnsavedChanges(false)
    }

    const handleSaveAndLeave = async () => {
        await handleSave()
        if (pendingDate){
            setWeekStart(pendingDate)
            setPendingDate(null)
        }
        if (blocker.state === "blocked"){
            blocker.proceed()
        }
        setUnsavedChanges(false)
    }

    const handleCancel = () => {
        setPendingDate(null)
        if (blocker.state === "blocked"){
            blocker.reset()
        }
        setUnsavedChanges(false)
    }


    useEffect(() => {
        const fetchMeals = async () => {
            try{
                const [start, end] = getWeekStartEnd(weekStart)
                const response = await fetch(`${import.meta.env.VITE_API_URL}/meals?start=${start}&end=${end}`,
                    {
                        method: "GET",
                        credentials: "include"
                    }
                )
                if (!response.ok){
                    throw new Error("Error loading meal plan")
                }
                const mealData = await response.json()
                let meal_plan_obj = {}
                for (const meal of mealData){
                    const key = `${meal.meal_date}-${meal.meal_type}`
                    meal_plan_obj[key] = meal
                }
                setMealPlan(meal_plan_obj)
                setSavedMealPlan(meal_plan_obj)
            }catch(e){
                setNotification({message: e.message, type:"error"})
            }finally{
                console.log("done")
            }
        }
        fetchMeals()
    }, [weekStart])

    useEffect(() => {
        if (blocker.state === "blocked") {
            setUnsavedChanges(true)
        }
    }, [blocker.state])

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasChanges()){
                e.preventDefault()
                e.returnValue = ''
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [mealPlan, savedMealPlan])


    const weekDates = getWeekDates(weekStart)


    return (
        <>
            <SideBarHeading eyebrow={"Plan Your Meals"} title={"Meal Plan"} />
            <div className={styles.mainContainer}>
                {addMeal && <MealModal setAddMeal={setAddMeal} selectedSlot={selectedSlot} setMealPlan={setMealPlan}/>}
                {unsavedChanges && <UnsavedChangesModal handleCancel={handleCancel} handleDiscardAndLeave={handleDiscardAndLeave} handleSaveAndLeave={handleSaveAndLeave} />}
                <div className={styles.aboveTable}>
                    <div className={styles.week}>
                        <DatePicker 
                            selected={weekStart}
                            onChange={(date) => handleDateChange(date)}
                            customInput={
                                <button className={styles.weekSelector}>
                                    <span className={styles.weekLabel}>Week of </span>{`${getWeekRange(weekStart)} >`}
                                </button>
                            }
                            calendarStartDay={0}
                        />
                    </div>
                    <button type='button' disabled={!hasChanges()} onClick={handleSave} className={styles.savePlan}>
                        Save Plan
                    </button>
                </div>
                <div className={styles.table}>
                    <div className={`${styles.daysOfWeek} ${styles.tableRow}`}>
                        <div className={styles.day}></div>
                        {
                            days.map((day) => (
                                <div key={day} className={styles.day}>{`${day}`}</div>
                            ))
                        }
                    </div>
                    {
                        mealType.map((timeOfDay) => (
                            <div key={timeOfDay} className={`${styles[`${timeOfDay}Row`]} ${styles.tableRow}`}>
                                <div className={`${styles[`${timeOfDay}Cell`]}`}>{timeOfDay}</div>
                                {
                                    weekDates.map((date, index) => {
                                        const dateKey = formatDateKey(date)
                                        return(
                                            <div key={dateKey} className={`${styles[`${timeOfDay}Cell`]}`}>
                                            {
                                                mealPlan[`${dateKey}-${timeOfDay}`] ?
                                                <MealCard date={dateKey} timeOfDay={timeOfDay} deleteMeal={deleteMeal} recipe={mealPlan[`${dateKey}-${timeOfDay}`]} /> :
                                                <button onClick={() => openModal(dateKey, timeOfDay)}>+ Add Recipe</button>
                                            }
                                        </div>
                                        )
                                    })
                                }
                            </div>
                        ))
                    }
                </div>
            </div>
            {
                notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />
            }
        </>
    )
}