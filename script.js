        document.getElementById('start-link').addEventListener('click', function(e) {
            e.preventDefault();
            const circle = document.querySelector('.H-circle');
            circle.classList.add('expand-active');
            setTimeout(() => {
                window.location.href = 'conversation.html';
            }, 700);
        });