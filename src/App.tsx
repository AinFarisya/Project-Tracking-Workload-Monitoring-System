import { useEffect, useState } from "react";

import { Login } from "./components/Login";

import { GlobalDashboard } from "./components/admin/GlobalDashboard";
import { ManageUsers } from "./components/admin/ManageUsers";
import { EmployeeSummary } from "./components/admin/EmployeeSummary";
import { UpdateStatusPriority } from "./components/admin/UpdateStatusPriority";
import { AdminSettings } from "./components/admin/AdminSettings";
import { TeamGanttChart } from "./components/admin/TeamGanttChart";
import { Sidebar } from "./components/admin/Sidebar";


// =========================
// API CONFIGURATION
// =========================

const API_URL = "http://localhost:5000/api";


// =========================
// TYPES
// =========================

export interface Role {
  roleID: string;
  roleName: string;
}

export interface Employee {
  userID: string;
  roleID: string;
  name: string;
  email: string;
  passwordHash: string;

  phone?: string;
  department?: string;
  profilePicture?: string;
}

export interface Priority {
  priorityID: string;
  priorityLevel: string;
}

export interface Status {
  statusID: string;
  statusName: string;
}

export interface ProjectTimeline {
  milestoneID: string;
  milestone: string;
  startDate: string;
  endDate: string;
  status: string;
  updatedDate: string;
}

export interface Task {
  taskID: string;
  title: string;
  description: string;

  assignedToUserID:
    | string
    | string[];

  reportedByUserID: string;

  statusID: string;
  priorityID: string;

  createdDate: string;
  dueDate: string;

  completedDate:
    | string
    | null;

  documents: TaskDocument[];

  timeline?: ProjectTimeline[];

  projectID?: string;
  projectCode?: string;
  projectTitle?: string;
}

export interface TaskDocument {
  documentID: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedDate: string;
  fileData: string;
}

export interface Admin {
  adminID: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  profilePicture?: string;
}

export interface Notification {
  notificationID: string;
  userID: string;
  message: string;
  taskID: string;
  createdAt: string;
  read: boolean;
}

interface LoggedInUser {
  user_id: number;
  public_user_id: string | null;
  role_id: number;
  role_name: string;
  name: string;
  email: string;

  phone: string | null;
  department: string | null;
  profile_picture: string | null;

  must_change_password?: boolean;
  temp_password?: boolean;
  token_version?: number;
}

type ViewType =
  | "dashboard"
  | "users"
  | "summary"
  | "update"
  | "settings"
  | "gantt";


// =========================
// HELPERS
// =========================

function getStoredToken() {
  return (
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken")
  );
}


function getStoredUser():
  LoggedInUser | null {

  const stored =
    localStorage.getItem("currentUser") ||
    sessionStorage.getItem("currentUser");

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}


function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

  return value.split("T")[0];
}


// =========================
// APP
// =========================

export default function App() {

  // -------------------------
  // AUTH
  // -------------------------

  const [
    authenticatedUser,
    setAuthenticatedUser,
  ] =
    useState<LoggedInUser | null>(
      getStoredUser()
    );


  const [
    isAuthenticated,
    setIsAuthenticated,
  ] =
    useState(
      Boolean(
        getStoredToken() &&
        getStoredUser()
      )
    );


  // -------------------------
  // UI
  // -------------------------

  const [
    currentView,
    setCurrentView,
  ] =
    useState<ViewType>(
      "dashboard"
    );

  const [
    sidebarOpen,
    setSidebarOpen,
  ] =
    useState(true);

  const [
    selectedEmployee,
    setSelectedEmployee,
  ] =
    useState<string | null>(
      null
    );

  const [
    selectedTask,
    setSelectedTask,
  ] =
    useState<string | null>(
      null
    );


  // -------------------------
  // DATA
  // -------------------------

  const [
    admin,
    setAdmin,
  ] =
    useState<Admin | null>(
      null
    );

  const [
    roles,
    setRoles,
  ] =
    useState<Role[]>([]);

  const [
    employees,
    setEmployees,
  ] =
    useState<Employee[]>([]);

  const [
    priorities,
    setPriorities,
  ] =
    useState<Priority[]>([]);

  const [
    statuses,
    setStatuses,
  ] =
    useState<Status[]>([]);

  const [
    tasks,
    setTasks,
  ] =
    useState<Task[]>([]);

  const [
    notifications,
    setNotifications,
  ] =
    useState<Notification[]>([]);


  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    loadError,
    setLoadError,
  ] =
    useState("");


  // =========================
  // API FETCH HELPER
  // =========================

  const apiFetch = async (
    endpoint: string,
    options:
      RequestInit = {}
  ) => {

    const token =
      getStoredToken();

    const response =
      await fetch(
        `${API_URL}${endpoint}`,
        {
          ...options,

          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),

            ...(options.headers || {}),
          },
        }
      );


    if (response.status === 401) {

      handleLogout();

      throw new Error(
        "Your session has expired. Please log in again."
      );

    }


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Request failed"
      );

    }


    return data;
  };


  // =========================
  // LOAD BACKEND DATA
  // =========================

  const loadBackendData =
    async () => {

      if (!isAuthenticated) {
        return;
      }


      setIsLoading(true);
      setLoadError("");


      try {

        // -------------------------
        // LOAD API DATA
        // -------------------------

        const [
          usersData,
          rolesData,
          statusesData,
          prioritiesData,
          tasksData,
          milestonesData,
        ] =
          await Promise.all([
            apiFetch(
              "/users"
            ),

            apiFetch(
              "/reference/roles"
            ),

            apiFetch(
              "/reference/statuses"
            ),

            apiFetch(
              "/reference/priorities"
            ),

            apiFetch(
              "/tasks"
            ),

            apiFetch(
              "/project-milestones"
            ),
          ]);


        // =========================
        // USERS
        // =========================

        const mappedEmployees:
          Employee[] =
          (
            usersData.users ||
            []
          ).map(
            (user: any) => ({
              userID:
                String(
                  user.user_id
                ),

              roleID:
                String(
                  user.role_id
                ),

              name:
                user.name ||
                "",

              email:
                user.email ||
                "",

              passwordHash:
                "",

              phone:
                user.phone ||
                "",

              department:
                user.department ||
                "",

              profilePicture:
                user.profile_picture ||
                undefined,
            })
          );


        setEmployees(
          mappedEmployees
        );


        // =========================
        // ROLES
        // =========================

        const mappedRoles:
          Role[] =
          (
            rolesData.roles ||
            []
          ).map(
            (role: any) => ({
              roleID:
                String(
                  role.role_id
                ),

              roleName:
                role.role_name,
            })
          );


        setRoles(
          mappedRoles
        );


        // =========================
        // STATUSES
        // =========================

        const mappedStatuses:
          Status[] =
          (
            statusesData.statuses ||
            []
          ).map(
            (status: any) => ({
              statusID:
                String(
                  status.status_id
                ),

              statusName:
                status.status_name,
            })
          );


        setStatuses(
          mappedStatuses
        );


        // =========================
        // PRIORITIES
        // =========================

        const mappedPriorities:
          Priority[] =
          (
            prioritiesData.priorities ||
            []
          ).map(
            (priority: any) => ({
              priorityID:
                String(
                  priority.priority_id
                ),

              priorityLevel:
                priority.priority_level,
            })
          );


        setPriorities(
          mappedPriorities
        );


        // =========================
        // MILESTONES
        // =========================

        const backendMilestones =
          milestonesData.milestones ||
          [];


        // =========================
        // TASKS
        // =========================

        const mappedTasks:
          Task[] =
          (
            tasksData.tasks ||
            []
          ).map(
            (task: any) => {

              const projectMilestones =
                backendMilestones.filter(
                  (milestone: any) =>
                    String(
                      milestone.project_id
                    ) ===
                    String(
                      task.project_id
                    )
                );


              const timeline:
                ProjectTimeline[] =
                projectMilestones.map(
                  (
                    milestone: any
                  ) => ({
                    milestoneID:
                      String(
                        milestone.milestone_id
                      ),

                    milestone:
                      milestone.title ||
                      "",

                    startDate:
                      formatDate(
                        milestone.start_date
                      ),

                    endDate:
                      formatDate(
                        milestone.end_date
                      ),

                    status:
                      milestone.status_name ||
                      "",

                    updatedDate:
                      formatDate(
                        milestone.created_at
                      ),
                  })
                );


              return {
                taskID:
                  String(
                    task.task_id
                  ),

                title:
                  task.title ||
                  "",

                description:
                  task.description ||
                  "",

                assignedToUserID:
                  task.assigned_to_user_id
                    ? String(
                        task.assigned_to_user_id
                      )
                    : "",

                reportedByUserID:
                  task.reported_by_user_id
                    ? String(
                        task.reported_by_user_id
                      )
                    : "",

                statusID:
                  task.status_id
                    ? String(
                        task.status_id
                      )
                    : "",

                priorityID:
                  task.priority_id
                    ? String(
                        task.priority_id
                      )
                    : "",

                createdDate:
                  formatDate(
                    task.creation_date
                  ),

                dueDate:
                  formatDate(
                    task.due_date
                  ),

                completedDate:
                  task.completion_date
                    ? formatDate(
                        task.completion_date
                      )
                    : null,

                documents:
                  [],

                timeline,

                projectID:
                  task.project_id
                    ? String(
                        task.project_id
                      )
                    : undefined,

                projectCode:
                  task.project_code ||
                  undefined,

                projectTitle:
                  task.project_title ||
                  undefined,
              };
            }
          );


        setTasks(
          mappedTasks
        );


        // =========================
        // ADMIN PROFILE
        // =========================

        const storedUser =
          getStoredUser();


        if (storedUser) {

          setAuthenticatedUser(
            storedUser
          );


          setAdmin({
            adminID:
              String(
                storedUser.user_id
              ),

            name:
              storedUser.name,

            email:
              storedUser.email,

            phone:
              storedUser.phone ||
              "",

            department:
              storedUser.department ||
              "",

            profilePicture:
              storedUser.profile_picture ||
              undefined,
          });

        }


      } catch (error: any) {

        console.error(
          "Failed to load backend data:",
          error
        );


        setLoadError(
          error.message ||
          "Failed to load system data."
        );

      } finally {

        setIsLoading(false);

      }
    };


  // =========================
  // LOAD DATA AFTER LOGIN
  // =========================

  useEffect(() => {

    if (isAuthenticated) {

      loadBackendData();

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);


  // =========================
  // LOGIN CALLBACK
  // =========================

  const handleLogin = (
    _email: string,
    _password: string
  ) => {

    const user =
      getStoredUser();


    if (!user) {
      return;
    }


    setAuthenticatedUser(
      user
    );


    setAdmin({
      adminID:
        String(
          user.user_id
        ),

      name:
        user.name,

      email:
        user.email,

      phone:
        user.phone ||
        "",

      department:
        user.department ||
        "",

      profilePicture:
        user.profile_picture ||
        undefined,
    });


    setIsAuthenticated(
      true
    );


    setCurrentView(
      "dashboard"
    );
  };


  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {

    localStorage.removeItem(
      "authToken"
    );

    localStorage.removeItem(
      "currentUser"
    );

    localStorage.removeItem(
      "userRole"
    );

    localStorage.removeItem(
      "userId"
    );

    localStorage.removeItem(
      "userName"
    );


    sessionStorage.removeItem(
      "authToken"
    );

    sessionStorage.removeItem(
      "currentUser"
    );

    sessionStorage.removeItem(
      "userRole"
    );

    sessionStorage.removeItem(
      "userId"
    );

    sessionStorage.removeItem(
      "userName"
    );


    setAuthenticatedUser(
      null
    );

    setAdmin(
      null
    );

    setEmployees(
      []
    );

    setRoles(
      []
    );

    setStatuses(
      []
    );

    setPriorities(
      []
    );

    setTasks(
      []
    );

    setNotifications(
      []
    );

    setIsAuthenticated(
      false
    );
  };


  // =========================
  // VIEW EMPLOYEE SUMMARY
  // =========================

  const handleViewEmployeeSummary =
    (
      employeeId: string
    ) => {

      setSelectedEmployee(
        employeeId
      );

      setCurrentView(
        "summary"
      );
    };


  // =========================
  // APPROVE UPDATE
  // =========================

  const handleApproveUpdate =
    (
      taskId: string
    ) => {

      setSelectedTask(
        taskId
      );

      setCurrentView(
        "update"
      );
    };


  // =========================
  // UPDATE TASK
  // =========================

  const handleUpdateTask =
    async (
      updatedTask: Task
    ) => {

      try {

        const oldTask =
          tasks.find(
            (task) =>
              task.taskID ===
              updatedTask.taskID
          );


        await apiFetch(
          `/tasks/${updatedTask.taskID}`,
          {
            method: "PUT",

            body:
              JSON.stringify({
                title:
                  updatedTask.title,

                assigned_to_user_id:
                  Array.isArray(
                    updatedTask.assignedToUserID
                  )
                    ? Number(
                        updatedTask.assignedToUserID[0]
                      )
                    : Number(
                        updatedTask.assignedToUserID
                      ),

                reported_by_user_id:
                  Number(
                    updatedTask.reportedByUserID
                  ),

                status_id:
                  Number(
                    updatedTask.statusID
                  ),

                priority_id:
                  Number(
                    updatedTask.priorityID
                  ),

                due_date:
                  updatedTask.dueDate ||
                  null,

                completion_date:
                  updatedTask.completedDate ||
                  null,

                project_id:
                  updatedTask.projectID
                    ? Number(
                        updatedTask.projectID
                      )
                    : null,
              }),
          }
        );


        setTasks(
          tasks.map(
            (task) =>
              task.taskID ===
              updatedTask.taskID
                ? updatedTask
                : task
          )
        );


        // -------------------------
        // LOCAL NOTIFICATION UI
        // -------------------------

        if (
          oldTask &&
          oldTask.statusID !==
            updatedTask.statusID &&
          updatedTask.statusID === "4"
        ) {

          const assignedUserIDs =
            Array.isArray(
              updatedTask.assignedToUserID
            )
              ? updatedTask.assignedToUserID
              : [
                  updatedTask.assignedToUserID,
                ];


          const newNotifications:
            Notification[] =
            assignedUserIDs.map(
              (userID) => ({
                notificationID:
                  `${Date.now()}-${userID}`,

                userID,

                message:
                  `Project requires revision: ${updatedTask.title}`,

                taskID:
                  updatedTask.taskID,

                createdAt:
                  new Date().toISOString(),

                read:
                  false,
              })
            );


          setNotifications(
            [
              ...notifications,
              ...newNotifications,
            ]
          );

        }


        setCurrentView(
          "summary"
        );


      } catch (error: any) {

        alert(
          error.message ||
          "Failed to update task."
        );

      }
    };


  // =========================
  // UPDATE EMPLOYEE
  // =========================

  const handleUpdateEmployee =
    async (
      updatedEmployee:
        Employee
    ) => {

      try {

        await apiFetch(
          `/users/${updatedEmployee.userID}`,
          {
            method: "PUT",

            body:
              JSON.stringify({
                role_id:
                  Number(
                    updatedEmployee.roleID
                  ),

                name:
                  updatedEmployee.name,

                email:
                  updatedEmployee.email,

                phone:
                  updatedEmployee.phone ||
                  null,

                department:
                  updatedEmployee.department ||
                  null,

                profile_picture:
                  updatedEmployee.profilePicture ||
                  null,
              }),
          }
        );


        setEmployees(
          employees.map(
            (employee) =>
              employee.userID ===
              updatedEmployee.userID
                ? updatedEmployee
                : employee
          )
        );


      } catch (error: any) {

        alert(
          error.message ||
          "Failed to update employee."
        );

      }
    };


  // =========================
  // ADD TASK
  // =========================

  const handleAddTask =
    async (
      task: Task
    ) => {

      try {

        const assignedUserID =
          Array.isArray(
            task.assignedToUserID
          )
            ? task.assignedToUserID[0]
            : task.assignedToUserID;


        const data =
          await apiFetch(
            "/tasks",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  title:
                    task.title,

                  assigned_to_user_id:
                    Number(
                      assignedUserID
                    ),

                  reported_by_user_id:
                    Number(
                      task.reportedByUserID
                    ),

                  status_id:
                    Number(
                      task.statusID
                    ),

                  priority_id:
                    Number(
                      task.priorityID
                    ),

                  due_date:
                    task.dueDate ||
                    null,

                  project_id:
                    task.projectID
                      ? Number(
                          task.projectID
                        )
                      : null,
                }),
            }
          );


        const createdTask =
          data.task;


        const newTask:
          Task = {
            ...task,

            taskID:
              String(
                createdTask.task_id
              ),
          };


        setTasks(
          [
            ...tasks,
            newTask,
          ]
        );


        // -------------------------
        // LOCAL NOTIFICATION UI
        // -------------------------

        const assignedUserIDs =
          Array.isArray(
            newTask.assignedToUserID
          )
            ? newTask.assignedToUserID
            : [
                newTask.assignedToUserID,
              ];


        const newNotifications:
          Notification[] =
          assignedUserIDs.map(
            (userID) => ({
              notificationID:
                `${Date.now()}-${userID}`,

              userID,

              message:
                `New project assigned: ${newTask.title}`,

              taskID:
                newTask.taskID,

              createdAt:
                new Date().toISOString(),

              read:
                false,
            })
          );


        setNotifications(
          [
            ...notifications,
            ...newNotifications,
          ]
        );


      } catch (error: any) {

        alert(
          error.message ||
          "Failed to create task."
        );

      }
    };


  // =========================
  // UPDATE ADMIN
  // =========================

  const handleUpdateAdmin =
    async (
      updatedAdmin:
        Admin
    ) => {

      try {

        await apiFetch(
          `/users/${updatedAdmin.adminID}`,
          {
            method: "PUT",

            body:
              JSON.stringify({
                name:
                  updatedAdmin.name,

                email:
                  updatedAdmin.email,

                phone:
                  updatedAdmin.phone ||
                  null,

                department:
                  updatedAdmin.department ||
                  null,

                profile_picture:
                  updatedAdmin.profilePicture ||
                  null,
              }),
          }
        );


        setAdmin(
          updatedAdmin
        );


        if (
          authenticatedUser
        ) {

          const updatedUser = {
            ...authenticatedUser,

            name:
              updatedAdmin.name,

            email:
              updatedAdmin.email,

            phone:
              updatedAdmin.phone,

            department:
              updatedAdmin.department,

            profile_picture:
              updatedAdmin.profilePicture ||
              null,
          };


          setAuthenticatedUser(
            updatedUser
          );


          if (
            localStorage.getItem(
              "currentUser"
            )
          ) {

            localStorage.setItem(
              "currentUser",
              JSON.stringify(
                updatedUser
              )
            );

          }


          if (
            sessionStorage.getItem(
              "currentUser"
            )
          ) {

            sessionStorage.setItem(
              "currentUser",
              JSON.stringify(
                updatedUser
              )
            );

          }
        }


      } catch (error: any) {

        alert(
          error.message ||
          "Failed to update administrator profile."
        );

      }
    };


  // =========================
  // DELETE TASK
  // =========================

  const handleDeleteTask =
    async (
      taskId: string
    ) => {

      try {

        await apiFetch(
          `/tasks/${taskId}`,
          {
            method:
              "DELETE",
          }
        );


        setTasks(
          tasks.filter(
            (task) =>
              task.taskID !==
              taskId
          )
        );


      } catch (error: any) {

        alert(
          error.message ||
          "Failed to delete task."
        );

      }
    };


  // =========================
  // LOGIN SCREEN
  // =========================

  if (!isAuthenticated) {

    return (
      <Login
        onLogin={
          handleLogin
        }
      />
    );
  }


  // =========================
  // INITIAL LOADING
  // =========================

  if (
    isLoading &&
    !admin
  ) {

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600">

            Loading system data...

          </p>

        </div>

      </div>
    );
  }


  // =========================
  // LOAD ERROR
  // =========================

  if (
    loadError &&
    !admin
  ) {

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">

        <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md w-full">

          <h2 className="text-red-700 mb-2">

            Unable to load dashboard

          </h2>

          <p className="text-gray-600 mb-4">

            {loadError}

          </p>

          <div className="flex gap-3">

            <button
              onClick={
                loadBackendData
              }
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Try Again
            </button>

            <button
              onClick={
                handleLogout
              }
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              Log Out
            </button>

          </div>

        </div>

      </div>
    );
  }


  if (!admin) {
    return null;
  }


  // =========================
  // ADMIN PANEL
  // =========================

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* =========================
          SIDEBAR
      ========================== */}

      <Sidebar
        isOpen={sidebarOpen}
        currentView={currentView}
        onNavigate={setCurrentView}
        onToggle={() =>
          setSidebarOpen(
            !sidebarOpen
          )
        }
      />


      {/* =========================
          MAIN
      ========================== */}

      <div className="flex-1 flex flex-col">

        {/* =========================
            HEADER
        ========================== */}

        <header className="bg-white border-b border-gray-300 sticky top-0 z-10">

          <div className="px-4 sm:px-6 lg:px-8">

            <div className="flex items-center justify-between py-4">

              <h1 className="text-gray-900">

                Project Management System - Admin Panel

              </h1>


              <div className="flex items-center gap-3">

                {/* REFRESH */}

                <button
                  onClick={
                    loadBackendData
                  }
                  disabled={
                    isLoading
                  }
                  className="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >

                  {isLoading
                    ? "Refreshing..."
                    : "Refresh"}

                </button>


                {/* PROFILE */}

                <button
                  onClick={() =>
                    setCurrentView(
                      "settings"
                    )
                  }
                  className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                >

                  {admin.profilePicture ? (

                    <img
                      src={
                        admin.profilePicture
                      }
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-gray-300"
                    />

                  ) : (

                    <div className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center">

                      {admin.name
                        .charAt(0)
                        .toUpperCase()}

                    </div>

                  )}


                  <span className="text-gray-700">

                    {admin.name}

                  </span>

                </button>


                {/* LOGOUT */}

                <button
                  onClick={
                    handleLogout
                  }
                  className="text-sm px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >

                  Log Out

                </button>

              </div>

            </div>

          </div>

        </header>


        {/* =========================
            CONTENT
        ========================== */}

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 overflow-auto">

          {loadError && (

            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">

              {loadError}

            </div>

          )}


          {/* DASHBOARD */}

          {currentView ===
            "dashboard" && (

            <GlobalDashboard
              tasks={tasks}
              employees={
                employees
              }
              statuses={
                statuses
              }
              priorities={
                priorities
              }
              roles={roles}
              onViewEmployee={
                handleViewEmployeeSummary
              }
            />

          )}


          {/* USERS */}

          {currentView ===
            "users" && (

            <ManageUsers
              employees={
                employees
              }
              roles={roles}
              tasks={tasks}
              priorities={
                priorities
              }
              statuses={
                statuses
              }
              onUpdateEmployee={
                handleUpdateEmployee
              }
              onAddTask={
                handleAddTask
              }
              adminId={
                admin.adminID
              }
            />

          )}


          {/* EMPLOYEE SUMMARY */}

          {currentView ===
            "summary" && (

            <EmployeeSummary
              selectedEmployeeId={
                selectedEmployee
              }
              employees={
                employees
              }
              tasks={tasks}
              statuses={
                statuses
              }
              priorities={
                priorities
              }
              roles={roles}
              onApproveUpdate={
                handleApproveUpdate
              }
              onSelectEmployee={
                setSelectedEmployee
              }
              onDeleteTask={
                handleDeleteTask
              }
              onUpdateTask={
                handleUpdateTask
              }
              currentUserId={
                admin.adminID
              }
            />

          )}


          {/* UPDATE */}

          {currentView ===
            "update" &&
            selectedTask && (

            <UpdateStatusPriority
              task={
                tasks.find(
                  (task) =>
                    task.taskID ===
                    selectedTask
                )!
              }
              statuses={
                statuses
              }
              priorities={
                priorities
              }
              employees={
                employees
              }
              onUpdate={
                handleUpdateTask
              }
              onCancel={() =>
                setCurrentView(
                  "summary"
                )
              }
            />

          )}


          {/* SETTINGS */}

          {currentView ===
            "settings" && (

            <AdminSettings
              admin={admin}
              onUpdate={
                handleUpdateAdmin
              }
            />

          )}


          {/* GANTT */}

          {currentView ===
            "gantt" && (

            <TeamGanttChart
              tasks={tasks}
              employees={
                employees
              }
              statuses={
                statuses
              }
              priorities={
                priorities
              }
              roles={roles}
            />

          )}

        </main>

      </div>

    </div>
  );
}