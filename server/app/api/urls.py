from django.urls import path
from .views import get_tasks,create_task, update_task,delete_task,get_taskid
urlpatterns = [
    path('tasks/', get_tasks, name='get_tasks'),
    path('tasks/create/', create_task, name='create_task'),
    path('tasks/<int:pk>/delete/', delete_task, name='delete_task'),
    path('tasks/<int:pk>/update/', update_task, name='update_task'),
    path('tasks/<int:pk>/', get_taskid, name='get_taskid'),
]  