document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('editableTable').getElementsByTagName('tbody')[0];
    const addRowButton = document.getElementById('addRow');
    const rowsPerPageSelect = document.getElementById('rowsPerPage');
    const pageInfo = document.getElementById('pageInfo');
    const pagination = document.getElementById('pagination');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    // API Configuration
    const API_BASE_URL = 'https://jsonplaceholder.typicode.com'; // Example API
    let tableData = [];
    let filteredData = [];
    let currentPage = 1;
    let rowsPerPage = 10;
    let searchTerm = '';

    // Fetch data from API on page load
    fetchTableData();

    // Event Listeners
    addRowButton.addEventListener('click', function() {
        addNewRow();
    });

    rowsPerPageSelect.addEventListener('change', function() {
        rowsPerPage = parseInt(this.value);
        currentPage = 1;
        renderTable();
        updatePagination();
    });

    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            updatePagination();
        }
    });

    nextPageBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            updatePagination();
        }
    });

    // Search functionality
    searchInput.addEventListener('input', function() {
        searchTerm = this.value.toLowerCase().trim();
        performSearch();
    });

    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchTerm = '';
        performSearch();
        searchInput.focus();
    });

    // Handle Enter key in search input
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.blur();
        }
    });

    // Perform search and filter data
    function performSearch() {
        if (searchTerm === '') {
            filteredData = [...tableData];
        } else {
            filteredData = tableData.filter(item => {
                return item.name.toLowerCase().includes(searchTerm) ||
                       item.age.toString().includes(searchTerm) ||
                       item.country.toLowerCase().includes(searchTerm);
            });
        }
        
        // Reset to first page when searching
        currentPage = 1;
        renderTable();
        updatePagination();
    }

    // Fetch table data from API
    async function fetchTableData() {
        try {
            showLoadingState();
            const response = await fetch(`${API_BASE_URL}/users`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const users = await response.json();
            
            // Transform API data to match our table structure
            tableData = users.map(user => ({
                id: user.id,
                name: user.name,
                age: Math.floor(Math.random() * 50) + 20, // Random age since API doesn't provide it
                country: user.address.city || 'Unknown'
            }));
            
            filteredData = [...tableData];
            renderTable();
            updatePagination();
            hideLoadingState();
        } catch (error) {
            console.error('Error fetching data:', error);
            hideLoadingState();
            showErrorMessage('Failed to load data from API');
        }
    }

    // Render table with pagination
    function renderTable() {
        table.innerHTML = '';
        
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        if (pageData.length === 0 && searchTerm !== '') {
            table.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999; font-style: italic;">No results found for your search</td></tr>';
        } else if (pageData.length === 0) {
            table.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999; font-style: italic;">No data available</td></tr>';
        } else {
            pageData.forEach(item => {
                const row = createTableRow(item);
                table.appendChild(row);
            });
        }
        
        updatePageInfo();
    }

    // Create a table row element with search highlighting
    function createTableRow(data) {
        const row = document.createElement('tr');
        row.dataset.id = data.id;
        
        // Highlight search terms in the data
        const highlightedName = highlightSearchTerm(data.name.toString(), searchTerm);
        const highlightedAge = highlightSearchTerm(data.age.toString(), searchTerm);
        const highlightedCountry = highlightSearchTerm(data.country.toString(), searchTerm);
        
        row.innerHTML = `
            <td contenteditable="true" data-field="name">${highlightedName}</td>
            <td contenteditable="true" data-field="age">${highlightedAge}</td>
            <td contenteditable="true" data-field="country">${highlightedCountry}</td>
            <td><button class="deleteRow">Delete</button></td>
        `;
        
        // Attach events to the new row
        attachDeleteEvent(row.querySelector('.deleteRow'));
        attachEditEvents(row);
        
        return row;
    }

    // Highlight search terms in text
    function highlightSearchTerm(text, searchTerm) {
        if (!searchTerm || searchTerm === '') {
            return text;
        }
        
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // Update pagination controls
    function updatePagination() {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        
        // Update previous/next buttons
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        
        // Generate page numbers
        generatePageNumbers(totalPages);
    }

    // Generate page number buttons
    function generatePageNumbers(totalPages) {
        pageNumbers.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Add first page and ellipsis if needed
        if (startPage > 1) {
            addPageButton(1);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '8px 4px';
                pageNumbers.appendChild(ellipsis);
            }
        }
        
        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            addPageButton(i);
        }
        
        // Add last page and ellipsis if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '8px 4px';
                pageNumbers.appendChild(ellipsis);
            }
            addPageButton(totalPages);
        }
    }

    // Add page button
    function addPageButton(pageNum) {
        const button = document.createElement('button');
        button.textContent = pageNum;
        button.className = pageNum === currentPage ? 'active' : '';
        button.addEventListener('click', function() {
            currentPage = pageNum;
            renderTable();
            updatePagination();
        });
        pageNumbers.appendChild(button);
    }

    // Update page info text
    function updatePageInfo() {
        const startIndex = (currentPage - 1) * rowsPerPage + 1;
        const endIndex = Math.min(currentPage * rowsPerPage, filteredData.length);
        const total = filteredData.length;
        const totalRecords = tableData.length;
        
        if (total === 0) {
            if (searchTerm !== '') {
                pageInfo.textContent = `No results found (${totalRecords} total entries)`;
            } else {
                pageInfo.textContent = 'Showing 0 to 0 of 0 entries';
            }
        } else {
            const searchText = searchTerm !== '' ? ` (filtered from ${totalRecords} total entries)` : '';
            pageInfo.textContent = `Showing ${startIndex} to ${endIndex} of ${total} entries${searchText}`;
        }
    }

    // Add new row functionality
    function addNewRow() {
        const newId = Math.max(...tableData.map(item => item.id), 0) + 1;
        const newData = {
            id: newId,
            name: 'New Name',
            age: 25,
            country: 'Country'
        };
        
        tableData.unshift(newData); // Add to beginning
        
        // Re-apply search filter
        performSearch();
        
        // Call API to add new record
        updateRecordInAPI(newData, 'POST');
    }

    // Attach delete event to button
    function attachDeleteEvent(button) {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = parseInt(row.dataset.id);
            
            // Remove from local data
            tableData = tableData.filter(item => item.id !== id);
            
            // Re-apply search filter
            performSearch();
            
            // Call API to delete record
            deleteRecordFromAPI(id);
        });
    }

    // Attach edit events to editable cells
    function attachEditEvents(row) {
        const editableCells = row.querySelectorAll('td[contenteditable="true"]');
        
        editableCells.forEach(cell => {
            cell.addEventListener('focus', function() {
                // Remove highlighting when editing
                const text = this.textContent;
                this.innerHTML = text;
            });
            
            cell.addEventListener('blur', function() {
                handleCellEdit(this);
            });
            
            cell.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.blur();
                }
            });
        });
    }

    // Handle cell edit
    function handleCellEdit(cell) {
        const row = cell.closest('tr');
        const id = parseInt(row.dataset.id);
        const field = cell.dataset.field;
        const newValue = cell.textContent.trim();
        
        // Update local data
        const item = tableData.find(item => item.id === id);
        
        if (item) {
            const processedValue = field === 'age' ? parseInt(newValue) || 0 : newValue;
            item[field] = processedValue;
            
            // Re-apply search filter to update filtered data
            performSearch();
            
            // Call API to update record
            updateRecordInAPI(item, 'PUT');
        }
    }

    // Update record in API
    async function updateRecordInAPI(data, method = 'PUT') {
        try {
            const url = method === 'POST' ? `${API_BASE_URL}/users` : `${API_BASE_URL}/users/${data.id}`;
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    age: data.age,
                    address: {
                        city: data.country
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`Record ${method === 'POST' ? 'created' : 'updated'} successfully:`, result);
            showSuccessMessage(`Record ${method === 'POST' ? 'added' : 'updated'} successfully`);
        } catch (error) {
            console.error('Error updating record:', error);
            showErrorMessage('Failed to update record');
        }
    }

    // Delete record from API
    async function deleteRecordFromAPI(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log(`Record ${id} deleted successfully`);
            showSuccessMessage('Record deleted successfully');
        } catch (error) {
            console.error('Error deleting record:', error);
            showErrorMessage('Failed to delete record');
        }
    }

    // UI Helper Functions
    function showLoadingState() {
        table.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading data...</td></tr>';
        pageInfo.textContent = 'Loading...';
    }

    function hideLoadingState() {
        // Loading state is hidden when table is rendered
    }

    function showSuccessMessage(message) {
        showMessage(message, 'success');
    }

    function showErrorMessage(message) {
        showMessage(message, 'error');
    }

    function showMessage(message, type) {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;
        
        document.body.appendChild(messageEl);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }
});