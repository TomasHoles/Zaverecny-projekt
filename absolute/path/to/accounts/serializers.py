class UserSerializer(serializers.ModelSerializer):
    # ... existing code ...
    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'password2', 'first_name', 'last_name', 
                 'currency_preference', 'avatar', 'date_joined', 'is_active')
        read_only_fields = ('date_joined', 'is_active', 'currency_preference')